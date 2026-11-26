#!/usr/bin/env python3
"""
Start one or more servers, wait for them to be ready, run a command, then clean up.

Usage:
    # Single server
    python3 scripts/with_server.py --server "npm run dev" --port 5173 -- uv run --with playwright python automation.py

    # Multiple servers
    python3 scripts/with_server.py \
      --server "cd backend && uv run uvicorn griffier.main:app --port 8000" --port 8000 \
      --server "cd frontend && npm run dev" --port 5173 \
      -- uv run --with playwright python test.py
"""

import argparse
import os
import signal
import socket
import subprocess
import sys
import time


def is_port_open(port: int) -> bool:
    """Check if a local TCP port is accepting connections on IPv4 or IPv6."""
    for host in ("127.0.0.1", "::1"):
        try:
            with socket.create_connection((host, port), timeout=0.5):
                return True
        except OSError:
            continue
    return False


def wait_for_server(process: subprocess.Popen[bytes], port: int, timeout: int = 30) -> bool:
    """Wait for server to listen on port, failing fast if the process exits."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        if process.poll() is not None:
            return False
        if is_port_open(port):
            return True
        time.sleep(0.25)
    return False


def stop_process(process: subprocess.Popen[bytes]) -> None:
    """Terminate a server process and its child process group cleanly."""
    if process.poll() is not None:
        return
    try:
        if os.name == "posix":
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        else:
            process.terminate()
        process.wait(timeout=5)
    except (ProcessLookupError, subprocess.TimeoutExpired):
        try:
            if os.name == "posix":
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)
            else:
                process.kill()
            process.wait(timeout=5)
        except (ProcessLookupError, subprocess.TimeoutExpired):
            pass


def main() -> None:
    parser = argparse.ArgumentParser(description="Run command with one or more servers")
    parser.add_argument("--server", action="append", dest="servers", required=True, help="Server command (can be repeated)")
    parser.add_argument("--port", action="append", dest="ports", type=int, required=True, help="Port for each server (must match --server count)")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout in seconds per server (default: 30)")
    parser.add_argument("command", nargs=argparse.REMAINDER, help="Command to run after server(s) ready")

    args = parser.parse_args()

    if args.command and args.command[0] == "--":
        args.command = args.command[1:]

    if not args.command:
        print("Error: No command specified to run", file=sys.stderr)
        sys.exit(1)

    if len(args.servers) != len(args.ports):
        print("Error: Number of --server and --port arguments must match", file=sys.stderr)
        sys.exit(1)

    servers = [{"cmd": cmd, "port": port} for cmd, port in zip(args.servers, args.ports)]
    server_processes: list[subprocess.Popen[bytes]] = []

    try:
        for i, server in enumerate(servers):
            print(f"Starting server {i + 1}/{len(servers)}: {server['cmd']}")
            process = subprocess.Popen(
                server["cmd"],
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                start_new_session=(os.name == "posix"),
            )
            server_processes.append(process)

            print(f"Waiting for server on port {server['port']}...")
            if not wait_for_server(process, server["port"], timeout=args.timeout):
                stop_process(process)
                out, err = process.communicate()
                details = (err or out).decode(errors="replace").strip()
                msg = f"Server failed to start on port {server['port']} within {args.timeout}s"
                if details:
                    msg += f"\n--- server output ---\n{details}"
                raise RuntimeError(msg)

            print(f"Server ready on port {server['port']}")

        print(f"\nAll {len(servers)} server(s) ready")
        print(f"Running: {' '.join(args.command)}\n")
        result = subprocess.run(args.command)
        sys.exit(result.returncode)

    finally:
        if server_processes:
            print(f"\nStopping {len(server_processes)} server(s)...")
            for i, process in enumerate(server_processes):
                stop_process(process)
                print(f"Server {i + 1} stopped")
            print("All servers stopped")


if __name__ == "__main__":
    main()

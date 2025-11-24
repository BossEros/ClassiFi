
import sys
import os
from fastapi import FastAPI
from fastapi.routing import APIRoute

# Add current directory to path so we can import api.main
sys.path.append(os.getcwd())

from api.main import app

def list_routes(app: FastAPI):
    with open("routes_clean.txt", "w", encoding="utf-8") as f:
        f.write("Registered Routes:\n")
        for route in app.routes:
            if isinstance(route, APIRoute):
                f.write(f"{route.methods} {route.path}\n")

if __name__ == "__main__":
    list_routes(app)

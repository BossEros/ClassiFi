"""
Cache Cleanup Utility
Removes Python bytecode cache files and directories that can cause issues
when code is updated but cached versions are still being used.

Usage:
    python cleanup_cache.py
"""

import os
import shutil
from pathlib import Path
from typing import List, Tuple


def find_cache_items(root_dir: Path) -> Tuple[List[Path], List[Path]]:
    """
    Find all Python cache files and directories.
    
    Args:
        root_dir: Root directory to search from
        
    Returns:
        Tuple of (cache_files, cache_dirs)
    """
    cache_files = []
    cache_dirs = []
    
    # Skip virtual environment directory
    skip_dirs = {'venv', '.venv', 'env', 'node_modules', '.git'}
    
    for root, dirs, files in os.walk(root_dir):
        # Remove skip directories from the search
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        # Find __pycache__ directories
        if '__pycache__' in dirs:
            cache_dirs.append(Path(root) / '__pycache__')
        
        # Find .pyc and .pyo files
        for file in files:
            if file.endswith(('.pyc', '.pyo')):
                cache_files.append(Path(root) / file)
    
    return cache_files, cache_dirs


def cleanup_cache(root_dir: Path, dry_run: bool = False) -> Tuple[int, int]:
    """
    Remove all Python cache files and directories.
    
    Args:
        root_dir: Root directory to clean
        dry_run: If True, only show what would be deleted
        
    Returns:
        Tuple of (files_removed, dirs_removed)
    """
    cache_files, cache_dirs = find_cache_items(root_dir)
    
    files_removed = 0
    dirs_removed = 0
    
    print(f"{'[DRY RUN] ' if dry_run else ''}Found {len(cache_files)} cache files")
    print(f"{'[DRY RUN] ' if dry_run else ''}Found {len(cache_dirs)} cache directories")
    print()
    
    # Remove cache files
    for cache_file in cache_files:
        try:
            if dry_run:
                print(f"Would remove file: {cache_file}")
            else:
                cache_file.unlink()
                files_removed += 1
                print(f"Removed: {cache_file}")
        except Exception as e:
            print(f"Error removing {cache_file}: {e}")
    
    # Remove cache directories
    for cache_dir in cache_dirs:
        try:
            if dry_run:
                print(f"Would remove directory: {cache_dir}")
            else:
                shutil.rmtree(cache_dir)
                dirs_removed += 1
                print(f"Removed: {cache_dir}")
        except Exception as e:
            print(f"Error removing {cache_dir}: {e}")
    
    return files_removed, dirs_removed


def main():
    """Main cleanup function."""
    # Get the backend directory (where this script is located)
    backend_dir = Path(__file__).parent
    
    print("=" * 60)
    print("Python Cache Cleanup Utility")
    print("=" * 60)
    print(f"Cleaning cache in: {backend_dir}")
    print()
    
    # First, do a dry run to show what will be deleted
    print("Scanning for cache files...")
    print()
    
    # Perform the actual cleanup
    files_removed, dirs_removed = cleanup_cache(backend_dir, dry_run=False)
    
    print()
    print("=" * 60)
    print("Cleanup Summary:")
    print(f"  Cache files removed: {files_removed}")
    print(f"  Cache directories removed: {dirs_removed}")
    print("=" * 60)
    print()
    print("✓ Cache cleanup complete!")
    print()
    print("Note: If you have a running development server,")
    print("please restart it to ensure it uses the updated code.")


if __name__ == "__main__":
    main()

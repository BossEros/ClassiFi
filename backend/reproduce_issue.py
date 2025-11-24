import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from repositories.database import AsyncSessionLocal
from services.services.teacher_dashboard_service import TeacherDashboardService

async def main():
    print("Starting reproduction script...")
    async with AsyncSessionLocal() as db:
        print(f"Session type: {type(db)}")
        service = TeacherDashboardService(db)
        try:
            print("Calling get_dashboard_data...")
            # Use teacher_id=11 as in the user request
            result = await service.get_dashboard_data(teacher_id=11)
            print("Result:", result)
        except Exception as e:
            print("Caught exception:")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

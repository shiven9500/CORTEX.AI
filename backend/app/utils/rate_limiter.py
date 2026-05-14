import json
import os
from datetime import datetime

class RateLimiter:
    def __init__(self, limit=50, file_path="rate_limit.json"):
        self.limit = limit
        self.file_path = file_path
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.file_path):
            self._reset()

    def _reset(self):
        data = {
            "date": str(datetime.now().date()),
            "count": 0
        }
        with open(self.file_path, "w") as f:
            json.dump(data, f)
        return data

    def _get_data(self):
        try:
            with open(self.file_path, "r") as f:
                data = json.load(f)
            
            if data["date"] != str(datetime.now().date()):
                return self._reset()
            return data
        except:
            return self._reset()

    def _save_data(self, count):
        data = {
            "date": str(datetime.now().date()),
            "count": count
        }
        with open(self.file_path, "w") as f:
            json.dump(data, f)

    def check(self):
        data = self._get_data()
        if data["count"] >= self.limit:
            return False, 0
        
        new_count = data["count"] + 1
        self._save_data(new_count)
        return True, self.limit - new_count

    def get_remaining(self):
        data = self._get_data()
        return max(0, self.limit - data["count"])

limiter = RateLimiter(limit=10)
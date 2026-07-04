import uuid

# Simple in-memory results store
results_store = {}

def save_result(verdict_data: dict) -> str:
    result_id = str(uuid.uuid4())[:8]
    results_store[result_id] = verdict_data
    return result_id

def get_result(result_id: str):
    return results_store.get(result_id)

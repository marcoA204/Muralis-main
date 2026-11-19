import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_flow():
    print("\n--- 1. Testing Health Check ---")
    res = client.get("/health")
    assert res.status_code == 200, res.text
    print("Health check OK:", res.json())

    print("\n--- 2. Testing Registration ---")
    res = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@muralis.app",
        "password": "secretpassword123"
    })
    # If already registered in a previous run, try login
    if res.status_code == 409:
        print("User already exists, logging in instead...")
        res = client.post("/auth/login", json={
            "email": "test@muralis.app",
            "password": "secretpassword123"
        })
    assert res.status_code in (200, 201), res.text
    auth_data = res.json()
    token = auth_data["token"]
    user = auth_data["user"]
    print("Registered/Logged in OK. User ID:", user["id"])

    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 3. Testing /auth/me ---")
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200, res.text
    print("Profile OK:", res.json()["name"])

    print("\n--- 4. Testing /assets/upload ---")
    file_content = b"fake image bytes content for mural"
    res = client.post(
        "/assets/upload",
        headers=headers,
        data={"type": "photo"},
        files={"file": ("photo.png", io.BytesIO(file_content), "image/png")}
    )
    assert res.status_code == 201, res.text
    asset_data = res.json()
    asset_id = asset_data["asset"]["id"]
    print("Asset Upload OK. Asset ID:", asset_id, "URL:", asset_data["url"])

    print("\n--- 5. Testing /projects (Create) ---")
    res = client.post(
        "/projects",
        headers=headers,
        json={
            "title": "Mural Teste Local",
            "basePhotoId": asset_id,
            "blendMode": "overlay",
            "opacity": 0.85
        }
    )
    assert res.status_code == 201, res.text
    project_data = res.json()
    project_id = project_data["id"]
    print("Project Created OK. Project ID:", project_id)

    print("\n--- 6. Testing /projects (List) ---")
    res = client.get("/projects", headers=headers)
    assert res.status_code == 200, res.text
    projects = res.json()
    assert len(projects) > 0
    print(f"Projects listed OK: {len(projects)} project(s) found.")

    print("\n--- 7. Testing /projects/{id}/share ---")
    res = client.post(
        f"/projects/{project_id}/share",
        headers=headers,
        json={"expiresInDays": 7}
    )
    assert res.status_code == 201, res.text
    share_data = res.json()
    token_str = share_data["token"]
    print("Share token created OK:", token_str)

    print("\n--- 8. Testing /share/{token} (Public link) ---")
    res = client.get(f"/share/{token_str}")
    assert res.status_code == 200, res.text
    shared_data = res.json()
    print("Shared project fetched OK. Title:", shared_data["project"]["title"])

    print("\n==========================================")
    print(" ALL TESTS PASSED SUCCESSFULLY! ")
    print("==========================================")

if __name__ == "__main__":
    test_full_flow()

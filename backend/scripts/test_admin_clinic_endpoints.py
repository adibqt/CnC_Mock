"""
Test script for Admin Clinic Management Endpoints
Run this after starting the backend server to test the admin clinic endpoints
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# Color codes for output
GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    print(f"{BLUE}ℹ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}⚠ {message}{RESET}")

def print_separator():
    print("\n" + "="*60 + "\n")

# Step 1: Admin Login
def admin_login():
    print_info("Step 1: Admin Login")
    
    response = requests.post(
        f"{BASE_URL}/api/admin/login",
        json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print_success(f"Admin logged in successfully")
        print(f"   Token: {token[:30]}...")
        return token
    else:
        print_error(f"Admin login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

# Step 2: Get Dashboard Stats
def get_dashboard_stats(token):
    print_info("Step 2: Get Dashboard Stats (including clinics)")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/admin/dashboard/stats", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print_success("Dashboard stats retrieved")
        print(f"   Total Clinics: {data['totals'].get('clinics', 0)}")
        print(f"   Unverified Clinics: {data['pending'].get('unverified_clinics', 0)}")
        print(f"   New Clinics (7d): {data['recent'].get('new_clinics_7d', 0)}")
        return data
    else:
        print_error(f"Failed to get dashboard stats: {response.status_code}")
        return None

# Step 3: Get Clinic Statistics
def get_clinic_stats(token):
    print_info("Step 3: Get Clinic Statistics Summary")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/admin/clinics/stats/summary", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print_success("Clinic stats retrieved")
        print(f"   Total Clinics: {data.get('total_clinics', 0)}")
        print(f"   Verified: {data.get('verified_clinics', 0)}")
        print(f"   Pending Verification: {data.get('pending_verification', 0)}")
        print(f"   Inactive: {data.get('inactive_clinics', 0)}")
        return data
    else:
        print_error(f"Failed to get clinic stats: {response.status_code}")
        return None

# Step 4: List All Clinics
def list_clinics(token, is_verified=None, limit=10):
    print_info(f"Step 4: List Clinics (verified={is_verified}, limit={limit})")
    
    headers = {"Authorization": f"Bearer {token}"}
    params = {"limit": limit}
    if is_verified is not None:
        params["is_verified"] = is_verified
    
    response = requests.get(
        f"{BASE_URL}/api/admin/clinics",
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        clinics = response.json()
        print_success(f"Retrieved {len(clinics)} clinics")
        
        if clinics:
            print("\n   Clinic List:")
            for i, clinic in enumerate(clinics[:5], 1):  # Show first 5
                status = "✓ Verified" if clinic['is_verified'] else "⏳ Pending"
                active = "🟢 Active" if clinic['is_active'] else "🔴 Inactive"
                print(f"   {i}. {clinic['clinic_name']} (ID: {clinic['id']})")
                print(f"      {status} | {active}")
                print(f"      📞 {clinic['phone']} | 📍 {clinic['city']}")
                print(f"      License: {clinic['license_number']}")
        else:
            print_warning("   No clinics found")
        
        return clinics
    else:
        print_error(f"Failed to list clinics: {response.status_code}")
        return []

# Step 5: Get Clinic Details
def get_clinic_details(token, clinic_id):
    print_info(f"Step 5: Get Clinic Details (ID: {clinic_id})")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/admin/clinics/{clinic_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        clinic = response.json()
        print_success("Clinic details retrieved")
        print(f"\n   📋 Clinic Information:")
        print(f"   Name: {clinic['clinic_name']}")
        print(f"   Contact: {clinic['contact_person']}")
        print(f"   Email: {clinic['email']}")
        print(f"   Phone: {clinic['phone']}")
        print(f"   Address: {clinic['address']}, {clinic['city']}")
        print(f"   License: {clinic['license_number']}")
        print(f"\n   📊 Statistics:")
        print(f"   Total Quotations: {clinic['stats']['total_quotations']}")
        print(f"   Total Reports: {clinic['stats']['total_reports']}")
        print(f"\n   Status:")
        print(f"   Verified: {clinic['is_verified']}")
        print(f"   Active: {clinic['is_active']}")
        if clinic.get('verified_at'):
            print(f"   Verified At: {clinic['verified_at']}")
        
        return clinic
    elif response.status_code == 404:
        print_warning(f"Clinic with ID {clinic_id} not found")
        return None
    else:
        print_error(f"Failed to get clinic details: {response.status_code}")
        return None

# Step 6: Search Clinics
def search_clinics(token, search_term):
    print_info(f"Step 6: Search Clinics (term: '{search_term}')")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/admin/clinics",
        headers=headers,
        params={"search": search_term, "limit": 5}
    )
    
    if response.status_code == 200:
        clinics = response.json()
        print_success(f"Found {len(clinics)} clinics matching '{search_term}'")
        
        if clinics:
            for clinic in clinics:
                print(f"   - {clinic['clinic_name']} ({clinic['city']})")
        
        return clinics
    else:
        print_error(f"Search failed: {response.status_code}")
        return []

# Main test runner
def run_tests():
    print("\n" + "="*60)
    print("   Admin Clinic Management API Test Suite")
    print("="*60 + "\n")
    
    print_warning(f"Testing against: {BASE_URL}")
    print_warning("Make sure the backend server is running!\n")
    
    try:
        # Test 1: Admin Login
        print_separator()
        token = admin_login()
        if not token:
            print_error("Cannot continue without admin token")
            return
        
        # Test 2: Dashboard Stats
        print_separator()
        dashboard_stats = get_dashboard_stats(token)
        
        # Test 3: Clinic Stats
        print_separator()
        clinic_stats = get_clinic_stats(token)
        
        # Test 4: List All Clinics
        print_separator()
        all_clinics = list_clinics(token, limit=10)
        
        # Test 5: List Unverified Clinics
        print_separator()
        unverified_clinics = list_clinics(token, is_verified=False, limit=10)
        
        # Test 6: Get Details of First Clinic (if exists)
        if all_clinics:
            print_separator()
            first_clinic_id = all_clinics[0]['id']
            clinic_details = get_clinic_details(token, first_clinic_id)
        
        # Test 7: Search Clinics
        print_separator()
        search_results = search_clinics(token, "Dhaka")
        
        # Summary
        print_separator()
        print_success("🎉 All tests completed!")
        print("\n📊 Summary:")
        print(f"   Admin Authentication: {'✓ Passed' if token else '✗ Failed'}")
        print(f"   Dashboard Stats: {'✓ Passed' if dashboard_stats else '✗ Failed'}")
        print(f"   Clinic Stats: {'✓ Passed' if clinic_stats else '✗ Failed'}")
        print(f"   List Clinics: {'✓ Passed' if all_clinics is not None else '✗ Failed'}")
        print(f"   Search Clinics: {'✓ Passed' if search_results is not None else '✗ Failed'}")
        
        print("\n" + "="*60 + "\n")
        
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to backend server")
        print_warning(f"Make sure the server is running at {BASE_URL}")
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    run_tests()

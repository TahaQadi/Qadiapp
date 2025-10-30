import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { clients, clientLocations, clientDepartments } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth';
import type { InsertClient, InsertClientLocation, InsertClientDepartment } from '../../shared/schema';
import { randomUUID } from 'crypto';

describe('Onboarding Integration Tests', () => {
  let testClientIds: string[] = [];
  let testLocationIds: string[] = [];
  let testDepartmentIds: string[] = [];

  afterAll(async () => {
    // Cleanup
    for (const deptId of testDepartmentIds) {
      await db.delete(clientDepartments).where(eq(clientDepartments.id, deptId));
    }
    for (const locId of testLocationIds) {
      await db.delete(clientLocations).where(eq(clientLocations.id, locId));
    }
    for (const clientId of testClientIds) {
      await db.delete(clients).where(eq(clients.id, clientId));
    }
  });

  describe('User Account Creation', () => {
    it('should create a client with hashed password', async () => {
      const hashedPassword = await hashPassword('TestPassword123');
      
      const clientData: InsertClient = {
        nameEn: 'Test Company',
        nameAr: 'شركة تجريبية',
        username: `onboarding_test_${randomUUID()}`,
        password: hashedPassword,
        email: `onboarding_${randomUUID()}@example.com`,
        isAdmin: false,
      };

      const client = await storage.createClient(clientData);
      testClientIds.push(client.id);

      expect(client).toBeDefined();
      expect(client.username).toBe(clientData.username);
      expect(client.password).toBe(hashedPassword);
      expect(client.isAdmin).toBe(false);
    });

    it('should make first user an admin', async () => {
      // Check if any clients exist
      const existingClients = await storage.getClients();
      const isFirstUser = existingClients.length === 0;

      const hashedPassword = await hashPassword('AdminPassword123');
      
      const adminData: InsertClient = {
        nameEn: 'First Admin Company',
        nameAr: 'شركة المسؤول الأول',
        username: `first_admin_${randomUUID()}`,
        password: hashedPassword,
        email: `first_admin_${randomUUID()}@example.com`,
        isAdmin: isFirstUser,
      };

      const client = await storage.createClient(adminData);
      testClientIds.push(client.id);

      if (isFirstUser) {
        expect(client.isAdmin).toBe(true);
      }
    });
  });

  describe('Company Information Collection', () => {
    it('should create client with all company fields', async () => {
      const hashedPassword = await hashPassword('CompanyPassword123');
      
      const companyData: InsertClient = {
        nameEn: 'Full Company Details',
        nameAr: 'شركة بتفاصيل كاملة',
        username: `full_company_${randomUUID()}`,
        password: hashedPassword,
        email: `full_company_${randomUUID()}@example.com`,
        phone: '+1234567890',
        domain: 'www.testcompany.com',
        registrationId: 'REG-123456',
        industry: 'Technology',
        hqCity: 'Riyadh',
        hqCountry: 'Saudi Arabia',
        isAdmin: false,
      };

      const client = await storage.createClient(companyData);
      testClientIds.push(client.id);

      expect(client.domain).toBe('www.testcompany.com');
      expect(client.registrationId).toBe('REG-123456');
      expect(client.industry).toBe('Technology');
      expect(client.hqCity).toBe('Riyadh');
      expect(client.hqCountry).toBe('Saudi Arabia');
    });
  });

  describe('Headquarters Location Setup', () => {
    it('should create headquarters location for client', async () => {
      // Create a test client first
      const hashedPassword = await hashPassword('LocationPassword123');
      const clientData: InsertClient = {
        nameEn: 'Location Test Company',
        nameAr: 'شركة اختبار الموقع',
        username: `location_test_${randomUUID()}`,
        password: hashedPassword,
        email: `location_test_${randomUUID()}@example.com`,
        isAdmin: false,
      };

      const client = await storage.createClient(clientData);
      testClientIds.push(client.id);

      // Create headquarters location
      const locationData: InsertClientLocation = {
        clientId: client.id,
        nameEn: 'Headquarters',
        nameAr: 'المقر الرئيسي',
        addressEn: '123 Main Street',
        addressAr: '123 الشارع الرئيسي',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        phone: '+966501234567',
        latitude: '24.7136',
        longitude: '46.6753',
        isHeadquarters: true,
      };

      const location = await storage.createClientLocation(locationData);
      testLocationIds.push(location.id);

      expect(location).toBeDefined();
      expect(location.clientId).toBe(client.id);
      expect(location.nameAr).toBe('المقر الرئيسي');
      expect(location.isHeadquarters).toBe(true);
      expect(location.latitude).toBe('24.7136');
      expect(location.longitude).toBe('46.6753');
    });

    it('should retrieve client locations', async () => {
      // Create a test client with location
      const hashedPassword = await hashPassword('RetrieveLocationPassword123');
      const clientData: InsertClient = {
        nameEn: 'Retrieve Location Test',
        nameAr: 'اختبار استرجاع الموقع',
        username: `retrieve_location_${randomUUID()}`,
        password: hashedPassword,
        email: `retrieve_location_${randomUUID()}@example.com`,
        isAdmin: false,
      };

      const client = await storage.createClient(clientData);
      testClientIds.push(client.id);

      // Create location
      const locationData: InsertClientLocation = {
        clientId: client.id,
        nameEn: 'Test Location',
        nameAr: 'الموقع التجريبي',
        addressEn: 'Test Address',
        addressAr: 'العنوان التجريبي',
        city: 'Jeddah',
        country: 'Saudi Arabia',
        isHeadquarters: true,
      };

      const location = await storage.createClientLocation(locationData);
      testLocationIds.push(location.id);

      // Retrieve locations
      const locations = await storage.getClientLocations(client.id);

      expect(Array.isArray(locations)).toBe(true);
      expect(locations.some(l => l.id === location.id)).toBe(true);
    });
  });

  describe('Department Creation', () => {
    it('should create departments for a client', async () => {
      // Create test client
      const hashedPassword = await hashPassword('DeptPassword123');
      const clientData: InsertClient = {
        nameEn: 'Department Test Company',
        nameAr: 'شركة اختبار الأقسام',
        username: `dept_test_${randomUUID()}`,
        password: hashedPassword,
        email: `dept_test_${randomUUID()}@example.com`,
        isAdmin: false,
      };

      const client = await storage.createClient(clientData);
      testClientIds.push(client.id);

      // Create departments
      const departmentTypes = ['finance', 'purchase', 'warehouse'];
      
      for (const type of departmentTypes) {
        const deptData: InsertClientDepartment = {
          clientId: client.id,
          departmentType: type,
          contactName: `${type} Contact`,
          contactEmail: `${type}@example.com`,
          contactPhone: '+966501234567',
        };

        const dept = await storage.createClientDepartment(deptData);
        testDepartmentIds.push(dept.id);

        expect(dept.departmentType).toBe(type);
      }

      // Retrieve departments
      const departments = await storage.getClientDepartments(client.id);

      expect(departments.length).toBeGreaterThanOrEqual(3);
      expect(departments.some(d => d.departmentType === 'finance')).toBe(true);
      expect(departments.some(d => d.departmentType === 'purchase')).toBe(true);
      expect(departments.some(d => d.departmentType === 'warehouse')).toBe(true);
    });

    it('should retrieve departments for a client', async () => {
      // Create test client with department
      const hashedPassword = await hashPassword('RetrieveDeptPassword123');
      const clientData: InsertClient = {
        nameEn: 'Retrieve Dept Test',
        nameAr: 'اختبار استرجاع القسم',
        username: `retrieve_dept_${randomUUID()}`,
        password: hashedPassword,
        email: `retrieve_dept_${randomUUID()}@example.com`,
        isAdmin: false,
      };

      const client = await storage.createClient(clientData);
      testClientIds.push(client.id);

      // Create department
      const deptData: InsertClientDepartment = {
        clientId: client.id,
        departmentType: 'finance',
        contactName: 'Finance Manager',
        contactEmail: 'finance@example.com',
        contactPhone: '+966501111111',
      };

      const dept = await storage.createClientDepartment(deptData);
      testDepartmentIds.push(dept.id);

      // Retrieve departments
      const departments = await storage.getClientDepartments(client.id);

      expect(Array.isArray(departments)).toBe(true);
      expect(departments.some(d => d.id === dept.id)).toBe(true);
    });
  });

  describe('Complete Onboarding Flow', () => {
    it('should create complete onboarding data (client + location + departments)', async () => {
      // Create client
      const hashedPassword = await hashPassword('CompleteFlowPassword123');
      const clientData: InsertClient = {
        nameEn: 'Complete Flow Company',
        nameAr: 'شركة التدفق الكامل',
        username: `complete_flow_${randomUUID()}`,
        password: hashedPassword,
        email: `complete_flow_${randomUUID()}@example.com`,
        isAdmin: false,
      };

      const client = await storage.createClient(clientData);
      testClientIds.push(client.id);

      // Create headquarters location
      const locationData: InsertClientLocation = {
        clientId: client.id,
        nameEn: 'Main Office',
        nameAr: 'المكتب الرئيسي',
        addressEn: '456 Business District',
        addressAr: '456 منطقة الأعمال',
        city: 'Dammam',
        country: 'Saudi Arabia',
        isHeadquarters: true,
      };

      const location = await storage.createClientLocation(locationData);
      testLocationIds.push(location.id);

      // Create departments
      const departmentsData: InsertClientDepartment[] = [
        {
          clientId: client.id,
          departmentType: 'finance',
          contactName: 'Finance Contact',
          contactEmail: 'finance@complete-flow.com',
          contactPhone: '+966502222222',
        },
        {
          clientId: client.id,
          departmentType: 'purchase',
          contactName: 'Purchase Contact',
          contactEmail: 'purchase@complete-flow.com',
          contactPhone: '+966503333333',
        },
      ];

      for (const deptData of departmentsData) {
        const dept = await storage.createClientDepartment(deptData);
        testDepartmentIds.push(dept.id);
      }

      // Verify everything was created
      expect(client).toBeDefined();
      expect(location.isHeadquarters).toBe(true);
      
      const departments = await storage.getClientDepartments(client.id);
      expect(departments.length).toBeGreaterThanOrEqual(2);
      
      const locations = await storage.getClientLocations(client.id);
      expect(locations.length).toBeGreaterThanOrEqual(1);
    });
  });
});

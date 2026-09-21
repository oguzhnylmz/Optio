const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  logo_url: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | string;
  currency: string;
}

export interface PublicEmployee {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
}

export interface PublicAvailability {
  date: string;
  employee_id: string;
  service_id: string;
  slots: string[];
}

export interface PublicAppointment {
  appointment_id: string;
  business_name: string;
  customer_name: string;
  service_name: string;
  employee_name: string;
  start_at: string;
  end_at: string;
  status: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterCustomerResponse {
  user_id?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
  is_admin?: boolean;
  [key: string]: unknown;
}

/*
 * ============================
 * CUSTOMER ACCOUNT APPOINTMENTS
 * ============================
 */

export interface CustomerAppointment {
  id: string;
  business_id?: string;
  customer_id?: string;
  employee_id?: string;
  service_id?: string;
  start_at: string;
  end_at: string;
  status: string;
  customer_note?: string | null;
  internal_note?: string | null;
  business_name?: string;
  service_name?: string | null;
  employee_name?: string | null;
  [key: string]: unknown;
}

/*
 * ============================
 * OWNER APPOINTMENTS
 * ============================
 */

export interface OwnerAppointment {
  id: string;
  business_id: string;
  customer_id: string;
  employee_id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  status: string;
  customer_note: string | null;
  internal_note: string | null;

  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  service_name?: string | null;
  employee_name?: string | null;

  [key: string]: unknown;
}

export interface OwnerCustomerAppointment {
  id: string;
  service_name: string | null;
  employee_name: string | null;
  start_at: string;
  end_at: string;
  status: string;
}

export type OwnerAppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface CreateOwnerAppointmentPayload {
  customer_id: string;
  employee_id: string;
  service_id: string;
  start_at: string;
  customer_note?: string | null;
  internal_note?: string | null;
}

export interface UpdateOwnerAppointmentPayload {
  employee_id?: string;
  service_id?: string;
  start_at?: string;
  customer_note?: string | null;
  internal_note?: string | null;
}

/*
 * ============================
 * OWNER SERVICES
 * ============================
 */

export interface OwnerService {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | string;
  currency: string;
  is_active: boolean;
}

export interface CreateServicePayload {
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  currency?: string;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number;
  currency?: string;
  is_active?: boolean;
}

/*
 * ============================
 * FETCH HELPERS
 * ============================
 */

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    let message =
      "API request failed.";

    try {
      const errorData =
        await response.json();

      if (
        errorData &&
        typeof errorData.detail ===
          "string"
      ) {
        message =
          errorData.detail;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function authenticatedFetch<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(
    path,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options?.headers ?? {}),
      },
    },
  );
}

/*
 * ============================
 * PUBLIC BUSINESS
 * ============================
 */

export async function getPublicBusiness(
  slug: string,
): Promise<PublicBusiness> {
  return apiFetch<PublicBusiness>(
    `/api/v1/public/businesses/${slug}`,
  );
}
export async function getPublicBusinesses(
  query?: string,
  city?: string,
): Promise<PublicBusiness[]> {
  const params = new URLSearchParams();

  if (query?.trim()) {
    params.set("q", query.trim());
  }

  if (city?.trim()) {
    params.set("city", city.trim());
  }

  const queryString = params.toString();

  return apiFetch<PublicBusiness[]>(
    `/api/v1/public/businesses${
      queryString
        ? `?${queryString}`
        : ""
    }`,
  );
}

export async function getPublicServices(
  slug: string,
): Promise<PublicService[]> {
  return apiFetch<PublicService[]>(
    `/api/v1/public/businesses/${slug}/services`,
  );
}

export async function getPublicEmployees(
  slug: string,
  serviceId?: string,
): Promise<PublicEmployee[]> {
  const query = serviceId
    ? `?service_id=${encodeURIComponent(
        serviceId,
      )}`
    : "";

  return apiFetch<PublicEmployee[]>(
    `/api/v1/public/businesses/${slug}/employees${query}`,
  );
}

export async function getPublicAvailability(
  slug: string,
  serviceId: string,
  employeeId: string,
  date: string,
): Promise<PublicAvailability> {
  const params =
    new URLSearchParams({
      service_id: serviceId,
      employee_id: employeeId,
      date,
    });

  return apiFetch<PublicAvailability>(
    `/api/v1/public/businesses/${slug}/availability?${params.toString()}`,
  );
}

export async function createPublicAppointment(
  slug: string,
  payload: {
    employee_id: string;
    service_id: string;
    start_at: string;
    full_name: string;
    phone: string;
    email?: string;
    customer_note?: string;
  },
): Promise<PublicAppointment> {
  return apiFetch<PublicAppointment>(
    `/api/v1/public/businesses/${slug}/appointments`,
    {
      method: "POST",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

/*
 * ============================
 * AUTH
 * ============================
 */

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );
}

export async function registerCustomer(
  payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
  },
): Promise<RegisterCustomerResponse> {
  return apiFetch<RegisterCustomerResponse>(
    "/api/v1/customer/register",
    {
      method: "POST",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function createBusinessApplication(
  payload: CreateBusinessApplicationPayload,
): Promise<BusinessApplication> {
  return apiFetch<BusinessApplication>(
    "/api/v1/business-applications",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function getMe(
  token: string,
): Promise<AuthUser> {
  return authenticatedFetch<AuthUser>(
    "/api/v1/auth/me",
    token,
  );
}

/*
 * ============================
 * BUSINESS APPLICATION
 * ============================
 */

export interface BusinessApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  business_name: string;
  business_type: string | null;
  business_phone: string | null;
  business_email: string | null;

  city: string;
  district: string | null;
  address: string | null;
  website: string | null;
  description: string | null;

  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;

  reviewed_at: string | null;
  reviewed_by: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateBusinessApplicationPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;

  business_name: string;
  business_type?: string;
  business_phone?: string;
  business_email?: string;

  city: string;
  district?: string;
  address?: string;
  website?: string;
  description?: string;
}

/*
 * ============================
 * CUSTOMER ACCOUNT
 * ============================
 */

export async function getCustomerAppointments(
  token: string,
): Promise<CustomerAppointment[]> {
  return authenticatedFetch<
    CustomerAppointment[]
  >(
    "/api/v1/customer/appointments",
    token,
  );
}

export async function cancelCustomerAppointment(
  token: string,
  appointmentId: string,
): Promise<CustomerAppointment> {
  return authenticatedFetch<CustomerAppointment>(
    `/api/v1/customer/appointments/${appointmentId}/cancel`,
    token,
    {
      method: "PATCH",
    },
  );
}

/*
 * ============================
 * OWNER APPOINTMENTS
 * ============================
 */

export async function getOwnerAppointments(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<OwnerAppointment[]> {
  const params =
    new URLSearchParams();

  if (startDate) {
    params.set(
      "start_date",
      startDate,
    );
  }

  if (endDate) {
    params.set(
      "end_date",
      endDate,
    );
  }

  const query =
    params.toString();

  return authenticatedFetch<
    OwnerAppointment[]
  >(
    `/api/v1/appointments${
      query ? `?${query}` : ""
    }`,
    token,
  );
}

export async function createOwnerAppointment(
  token: string,
  payload: CreateOwnerAppointmentPayload,
): Promise<OwnerAppointment> {
  return authenticatedFetch<OwnerAppointment>(
    "/api/v1/appointments",
    token,
    {
      method: "POST",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function updateOwnerAppointment(
  token: string,
  appointmentId: string,
  payload: UpdateOwnerAppointmentPayload,
): Promise<OwnerAppointment> {
  return authenticatedFetch<OwnerAppointment>(
    `/api/v1/appointments/${appointmentId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function updateOwnerAppointmentStatus(
  token: string,
  appointmentId: string,
  status: OwnerAppointmentStatus,
): Promise<OwnerAppointment> {
  return authenticatedFetch<OwnerAppointment>(
    `/api/v1/appointments/${appointmentId}/status`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    },
  );
}

/*
 * ============================
 * OWNER SERVICES
 * ============================
 */

export async function getOwnerServices(
  token: string,
): Promise<OwnerService[]> {
  return authenticatedFetch<OwnerService[]>(
    "/api/v1/services",
    token,
  );
}

export async function createOwnerService(
  token: string,
  payload: CreateServicePayload,
): Promise<OwnerService> {
  return authenticatedFetch<OwnerService>(
    "/api/v1/services",
    token,
    {
      method: "POST",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function getOwnerService(
  token: string,
  serviceId: string,
): Promise<OwnerService> {
  return authenticatedFetch<OwnerService>(
    `/api/v1/services/${serviceId}`,
    token,
  );
}

export async function updateOwnerService(
  token: string,
  serviceId: string,
  payload: UpdateServicePayload,
): Promise<OwnerService> {
  return authenticatedFetch<OwnerService>(
    `/api/v1/services/${serviceId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function deleteOwnerService(
  token: string,
  serviceId: string,
): Promise<OwnerService> {
  return authenticatedFetch<OwnerService>(
    `/api/v1/services/${serviceId}`,
    token,
    {
      method: "DELETE",
    },
  );
}

/*
 * ============================
 * OWNER EMPLOYEES
 * ============================
 */

export interface OwnerEmployee {
  id: string;
  business_id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export interface EmployeeService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | string;
  currency: string;
  is_active: boolean;
}

export interface CreateEmployeePayload {
  first_name: string;
  last_name: string;
  display_name?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateEmployeePayload {
  first_name?: string;
  last_name?: string;
  display_name?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
}

export async function getOwnerEmployees(
  token: string,
): Promise<OwnerEmployee[]> {
  return apiFetch<OwnerEmployee[]>(
    "/api/v1/employees",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function createOwnerEmployee(
  token: string,
  payload: CreateEmployeePayload,
): Promise<OwnerEmployee> {
  return apiFetch<OwnerEmployee>(
    "/api/v1/employees",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function getOwnerEmployee(
  token: string,
  employeeId: string,
): Promise<OwnerEmployee> {
  return apiFetch<OwnerEmployee>(
    `/api/v1/employees/${employeeId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function updateOwnerEmployee(
  token: string,
  employeeId: string,
  payload: UpdateEmployeePayload,
): Promise<OwnerEmployee> {
  return apiFetch<OwnerEmployee>(
    `/api/v1/employees/${employeeId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function deleteOwnerEmployee(
  token: string,
  employeeId: string,
): Promise<OwnerEmployee> {
  return apiFetch<OwnerEmployee>(
    `/api/v1/employees/${employeeId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function getEmployeeServices(
  token: string,
  employeeId: string,
): Promise<EmployeeService[]> {
  return apiFetch<EmployeeService[]>(
    `/api/v1/employees/${employeeId}/services`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function updateEmployeeServices(
  token: string,
  employeeId: string,
  serviceIds: string[],
): Promise<{
  employee_id: string;
  service_ids: string[];
}> {
  return apiFetch<{
    employee_id: string;
    service_ids: string[];
  }>(
    `/api/v1/employees/${employeeId}/services`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        service_ids: serviceIds,
      }),
    },
  );
}

/*
 * ============================
 * WORKING HOURS
 * ============================
 */

export interface BusinessHour {
  id: string;
  business_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface EmployeeAvailability {
  id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface WorkingHourPayload {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export async function getBusinessHours(
  token: string,
): Promise<BusinessHour[]> {
  return apiFetch<BusinessHour[]>(
    "/api/v1/business-hours",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function replaceBusinessHours(
  token: string,
  hours: WorkingHourPayload[],
): Promise<BusinessHour[]> {
  return apiFetch<BusinessHour[]>(
    "/api/v1/business-hours",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        hours,
      ),
    },
  );
}

export async function getEmployeeAvailability(
  token: string,
  employeeId: string,
): Promise<EmployeeAvailability[]> {
  return apiFetch<EmployeeAvailability[]>(
    `/api/v1/employees/${employeeId}/availability`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function replaceEmployeeAvailability(
  token: string,
  employeeId: string,
  availability: WorkingHourPayload[],
): Promise<EmployeeAvailability[]> {
  return apiFetch<EmployeeAvailability[]>(
    `/api/v1/employees/${employeeId}/availability`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        availability,
      ),
    },
  );
}

/*
 * ============================
 * OWNER CUSTOMERS
 * ============================
 */

export interface OwnerCustomer {
  id: string;
  business_id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
}

export interface CreateCustomerPayload {
  full_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerPayload {
  full_name?: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
}

export async function getOwnerCustomers(
  token: string,
): Promise<OwnerCustomer[]> {
  return apiFetch<OwnerCustomer[]>(
    "/api/v1/customers",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function createOwnerCustomer(
  token: string,
  payload: CreateCustomerPayload,
): Promise<OwnerCustomer> {
  return apiFetch<OwnerCustomer>(
    "/api/v1/customers",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function getOwnerCustomer(
  token: string,
  customerId: string,
): Promise<OwnerCustomer> {
  return apiFetch<OwnerCustomer>(
    `/api/v1/customers/${customerId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function updateOwnerCustomer(
  token: string,
  customerId: string,
  payload: UpdateCustomerPayload,
): Promise<OwnerCustomer> {
  return apiFetch<OwnerCustomer>(
    `/api/v1/customers/${customerId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function getOwnerCustomerAppointments(
  token: string,
  customerId: string,
): Promise<OwnerCustomerAppointment[]> {
  return apiFetch<OwnerCustomerAppointment[]>(
    `/api/v1/customers/${customerId}/appointments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

/* ============================================================
 * ADMIN — BUSINESS APPLICATIONS
 * ============================================================
 */

export type BusinessApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface AdminBusinessApplication {
  id: string;

  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  business_name: string;
  business_type: string | null;
  business_phone: string | null;
  business_email: string | null;

  city: string;
  district: string | null;
  address: string | null;
  website: string | null;
  description: string | null;

  status: BusinessApplicationStatus;

  rejection_reason: string | null;

  reviewed_at: string | null;
  reviewed_by: string | null;

  created_at: string;
  updated_at: string;
}

export async function getAdminBusinessApplications(
  token: string,
  status?: BusinessApplicationStatus,
): Promise<AdminBusinessApplication[]> {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  const query = params.toString();

  return authenticatedFetch<
    AdminBusinessApplication[]
  >(
    `/api/v1/admin/business-applications${
      query ? `?${query}` : ""
    }`,
    token,
  );
}

export async function getAdminBusinessApplication(
  token: string,
  applicationId: string,
): Promise<AdminBusinessApplication> {
  return authenticatedFetch<AdminBusinessApplication>(
    `/api/v1/admin/business-applications/${applicationId}`,
    token,
  );
}

export async function approveAdminBusinessApplication(
  token: string,
  applicationId: string,
): Promise<AdminBusinessApplication> {
  return authenticatedFetch<AdminBusinessApplication>(
    `/api/v1/admin/business-applications/${applicationId}/approve`,
    token,
    {
      method: "POST",
    },
  );
}

export async function rejectAdminBusinessApplication(
  token: string,
  applicationId: string,
  rejectionReason: string,
): Promise<AdminBusinessApplication> {
  return authenticatedFetch<AdminBusinessApplication>(
    `/api/v1/admin/business-applications/${applicationId}/reject`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        rejection_reason: rejectionReason,
      }),
    },
  );
}
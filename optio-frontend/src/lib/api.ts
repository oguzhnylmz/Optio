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
  [key: string]: unknown;
}

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
  service_name?: string;
  employee_name?: string;
  [key: string]: unknown;
}

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
    let message = "API request failed.";

    try {
      const errorData =
        await response.json();

      if (
        errorData &&
        typeof errorData.detail ===
          "string"
      ) {
        message = errorData.detail;
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
  return apiFetch<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
}

export async function getPublicBusiness(
  slug: string,
): Promise<PublicBusiness> {
  return apiFetch<PublicBusiness>(
    `/api/v1/public/businesses/${slug}`,
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
      body: JSON.stringify(payload),
    },
  );
}

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

export async function getOwnerAppointments(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<OwnerAppointment[]> {
  const params = new URLSearchParams();

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

export async function updateOwnerAppointmentStatus(
  token: string,
  appointmentId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
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
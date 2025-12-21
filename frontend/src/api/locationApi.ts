import httpClient from "./httpClient";

export type LocationType = "PROVINCE" | "DISTRICT" | "SECTOR" | "CELL" | "VILLAGE";

export interface LocationNode {
  id: number;
  code?: string;
  name: string;
  type: LocationType;
  parentId?: number | null;
  parentName?: string | null;
  path?: string;
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LocationFilter {
  type?: LocationType;
  parentId?: number;
  name?: string;
  code?: string;
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Location API following pharmacy-management pattern.
 * Main endpoint supports filtering by any column.
 */
export const locationApi = {
  /**
   * Main filtering endpoint - filter by any column (type, parentId, name, code, q).
   * Example: filter({ type: "DISTRICT", name: "Gasabo", page: 0, size: 20 })
   */
  filter: async (params?: LocationFilter): Promise<PagedResult<LocationNode>> => {
    const { data } = await httpClient.get<PagedResult<LocationNode>>("/locations", { params });
    return data;
  },

  /**
   * Get all locations (no pagination).
   */
  list: async (): Promise<LocationNode[]> => {
    const { data } = await httpClient.get<LocationNode[]>("/locations/all");
    return data;
  },

  /**
   * Get a single location by ID.
   */
  getById: async (id: number): Promise<LocationNode> => {
    const { data } = await httpClient.get<LocationNode>(`/locations/${id}`);
    return data;
  },

  /**
   * Get locations by type.
   */
  byType: async (type: LocationType): Promise<LocationNode[]> => {
    const { data } = await httpClient.get<LocationNode[]>(`/locations/type/${type}`);
    return data;
  },

  /**
   * Get children of a parent location.
   */
  children: async (parentId: number): Promise<LocationNode[]> => {
    const { data } = await httpClient.get<LocationNode[]>(`/locations/parent/${parentId}`);
    return data;
  },

  /**
   * Get paginated locations.
   */
  page: async (params?: { page?: number; size?: number; sort?: string }): Promise<PagedResult<LocationNode>> => {
    const { data } = await httpClient.get<PagedResult<LocationNode>>("/locations/page", { params });
    return data;
  },

  /**
   * Create a new location.
   */
  create: async (request: { code: string; name: string; type: LocationType; parentId?: number }): Promise<LocationNode> => {
    const { data } = await httpClient.post<LocationNode>("/locations", request);
    return data;
  },

  /**
   * Update a location.
   */
  update: async (id: number, request: { code: string; name: string; type: LocationType; parentId?: number }): Promise<LocationNode> => {
    const { data } = await httpClient.put<LocationNode>(`/locations/${id}`, request);
    return data;
  },

  /**
   * Delete a location.
   */
  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/locations/${id}`);
  },

  /**
   * Clear all existing locations and import from locations.json.
   */
  clearAndImport: async (): Promise<{ processedRows: number; totalLocations: number; skipped: boolean }> => {
    const { data } = await httpClient.post('/locations/clear-and-import');
    return data;
  },
};

// Type alias for compatibility
export type LocationDTO = LocationNode;

export default locationApi;

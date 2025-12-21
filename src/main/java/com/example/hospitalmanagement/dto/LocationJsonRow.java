package com.example.hospitalmanagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class LocationJsonRow {
    @JsonProperty("id")
    private String id;
    @JsonProperty("country_code")
    private String countryCode;
    @JsonProperty("country_name")
    private String countryName;
    @JsonProperty("province_code")
    private Object provinceCode;  // Can be String or Number
    @JsonProperty("province_name")
    private String provinceName;
    @JsonProperty("district_code")
    private Object districtCode;  // Can be String or Number
    @JsonProperty("district_name")
    private String districtName;
    @JsonProperty("sector_code")
    private Object sectorCode;  // Can be String or Number
    @JsonProperty("sector_name")
    private String sectorName;
    @JsonProperty("cell_code")
    private Object cellCode;  // Can be String or Number
    @JsonProperty("cell_name")
    private String cellName;
    @JsonProperty("village_code")
    private Object villageCode;  // Can be String or Number
    @JsonProperty("village_name")
    private String villageName;

    // Helper methods to get codes as strings
    public String getProvinceCodeStr() {
        return objectToString(provinceCode);
    }
    public String getDistrictCodeStr() {
        return objectToString(districtCode);
    }
    public String getSectorCodeStr() {
        return objectToString(sectorCode);
    }
    public String getCellCodeStr() {
        return objectToString(cellCode);
    }
    public String getVillageCodeStr() {
        return objectToString(villageCode);
    }

    private String objectToString(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) {
            return String.valueOf(((Number) obj).longValue());
        }
        return obj.toString().trim();
    }
}

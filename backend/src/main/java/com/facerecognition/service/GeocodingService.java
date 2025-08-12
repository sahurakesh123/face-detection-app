package com.facerecognition.service;

import org.springframework.stereotype.Service;

@Service
public class GeocodingService {

    /**
     * Returns a simple string representation of the coordinates.
     * A real implementation would call an external geocoding API.
     */
    public String getAddressFromCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return "Unknown Location";
        }
        return String.format("Lat: %.4f, Lng: %.4f", latitude, longitude);
    }
}

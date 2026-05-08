package com.gradproject.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry; // Add this
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String proposalsDir;
    private final String profilePhotosDir;
    private final String milestonesDir;

    public WebConfig(
            @Value("${app.storage.proposals-dir:./uploads/proposals}") String proposalsDir,
            @Value("${app.storage.profile-photos-dir:./uploads/profile-photos}") String profilePhotosDir,
            @Value("${app.storage.milestones-dir:./uploads/milestones}") String milestonesDir
    ) {
        this.proposalsDir = proposalsDir;
        this.profilePhotosDir = profilePhotosDir;
        this.milestonesDir = milestonesDir;
    }

    // 1. Keep your existing File Storage logic
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Paths.get(proposalsDir).toAbsolutePath().normalize().toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler("/files/**")
                .addResourceLocations(location);

        String profileLocation = Paths.get(profilePhotosDir).toAbsolutePath().normalize().toUri().toString();
        if (!profileLocation.endsWith("/")) {
            profileLocation = profileLocation + "/";
        }
        registry.addResourceHandler("/files/profile-photos/**")
                .addResourceLocations(profileLocation);

        String milestonesLocation = Paths.get(milestonesDir).toAbsolutePath().normalize().toUri().toString();
        if (!milestonesLocation.endsWith("/")) {
            milestonesLocation = milestonesLocation + "/";
        }
        registry.addResourceHandler("/files/milestones/**")
                .addResourceLocations(milestonesLocation);
    }

    // 2. Add the Global CORS Safety Net
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5176",
                        "http://localhost:5177"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}

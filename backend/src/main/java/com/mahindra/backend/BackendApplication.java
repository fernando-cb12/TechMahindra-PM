package com.mahindra.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.mahindra.backend.config.AwsSesProperties;
import com.mahindra.backend.config.JwtProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, AwsSesProperties.class})
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}

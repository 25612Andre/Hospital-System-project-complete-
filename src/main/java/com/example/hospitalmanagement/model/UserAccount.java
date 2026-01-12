package com.example.hospitalmanagement.model;

import com.example.hospitalmanagement.model.enums.Role;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "user_accounts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Email
    @Column(nullable = false, unique = true)
    private String username;

    @NotBlank
    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "two_factor_enabled")
    private boolean twoFactorEnabled;

    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    @ManyToOne
    @JoinColumn(name = "location_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"parent", "children", "patients", "users"})
    private Location location;

    @OneToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @OneToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;
}

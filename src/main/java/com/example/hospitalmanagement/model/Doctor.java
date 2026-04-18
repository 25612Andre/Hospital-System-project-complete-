package com.example.hospitalmanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@lombok.EqualsAndHashCode(exclude = {"department", "patients"})
@lombok.ToString(exclude = {"department", "patients"})
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Column(nullable = false)
    private String contact;

    @NotBlank
    @Column(nullable = false)
    private String specialization;

    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne
    @JoinColumn(name = "location_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"parent", "children", "patients", "users", "doctors"})
    private Location location;
    @Transient
    private String locationName;

    // Many-to-Many pairing with patients
    @ManyToMany(mappedBy = "doctors")
    @JsonIgnore
    private Set<Patient> patients;
}

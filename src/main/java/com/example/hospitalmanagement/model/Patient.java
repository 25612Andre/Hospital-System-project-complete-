package com.example.hospitalmanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.HashSet;
import java.util.Set;
import com.example.hospitalmanagement.model.Location;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@lombok.EqualsAndHashCode(exclude = "doctors")
@lombok.ToString(exclude = "doctors")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String fullName;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer age;

    @NotBlank
    @Column(nullable = false)
    private String gender;

    @NotBlank
    @Email
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String phone;

    @ManyToOne
    @JoinColumn(name = "location_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"parent", "children", "patients", "users"})
    private Location location;

    // Many-to-Many example: patients can be associated with multiple doctors
    @ManyToMany
    @JoinTable(name = "patient_doctors",
            joinColumns = @JoinColumn(name = "patient_id"),
            inverseJoinColumns = @JoinColumn(name = "doctor_id"))
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<Doctor> doctors = new HashSet<>();

    public Set<Doctor> getDoctors() {
        if (doctors == null) {
            doctors = new HashSet<>();
        }
        return doctors;
    }
}

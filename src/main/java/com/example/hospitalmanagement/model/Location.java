package com.example.hospitalmanagement.model;

import com.example.hospitalmanagement.model.enums.LocationType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Self-referencing Location entity for administrative hierarchy.
 * Follows hierarchy: PROVINCE -> DEPARTEMENT -> COMMUNE -> QUARTIER -> VILLAGE
 */
@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String code;

    @Column(length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private LocationType type;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties({"parent", "children", "patients", "users", "hibernateLazyInitializer", "handler"})
    private Location parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<Location> children = new ArrayList<>();

    @OneToMany(mappedBy = "location")
    @JsonIgnore
    @Builder.Default
    private List<Patient> patients = new ArrayList<>();

    @OneToMany(mappedBy = "location")
    @JsonIgnore
    @Builder.Default
    private List<UserAccount> users = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

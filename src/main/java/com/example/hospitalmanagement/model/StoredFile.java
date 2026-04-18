package com.example.hospitalmanagement.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stored_files")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String contentType;

    @Lob
    @Column(nullable = false, columnDefinition = "BYTEA")
    @Basic(fetch = FetchType.LAZY)
    private byte[] data;
}

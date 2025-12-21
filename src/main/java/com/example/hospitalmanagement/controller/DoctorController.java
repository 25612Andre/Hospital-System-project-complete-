package com.example.hospitalmanagement.controller;

import com.example.hospitalmanagement.model.Doctor;
import com.example.hospitalmanagement.service.DoctorService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService service;

    @GetMapping
    public ResponseEntity<List<Doctor>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Doctor>> getPage(@PageableDefault(sort = "id") Pageable pageable) {
        return ResponseEntity.ok(service.getPage(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Doctor>> search(@RequestParam @NonNull String q,
                                               @PageableDefault(sort = "name") Pageable pageable) {
        return ResponseEntity.ok(service.search(q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getById(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/exists")
    public ResponseEntity<Boolean> exists(@RequestParam String name) {
        return ResponseEntity.ok(service.existsByName(name));
    }

    @PostMapping
    public ResponseEntity<Doctor> create(@RequestBody @Valid @NonNull Doctor doctor) {
        return ResponseEntity.ok(service.save(doctor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Doctor> update(@PathVariable @NonNull Long id,
                                         @RequestBody @Valid @NonNull Doctor doctor) {
        return ResponseEntity.ok(service.update(id, doctor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ProductController {

    private final ProductService productService;

    @PostMapping("/create")
    public ResponseEntity<Product> create(
            @RequestParam String name,
            @RequestParam Double price,
            @RequestParam String description,
            @RequestParam Long categoryId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) MultipartFile imageFile
    ) throws IOException {

        return ResponseEntity.ok(
                productService.create(name, price, description, categoryId, isActive, imageFile)
        );
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Product> update(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam Double price,
            @RequestParam String description,
            @RequestParam Long categoryId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) MultipartFile imageFile
    ) throws IOException {

        return ResponseEntity.ok(
                productService.update(id, name, price, description, categoryId, isActive, imageFile)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Product>> getAll() {
        return ResponseEntity.ok(productService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Product>> getActive() {
        return ResponseEntity.ok(productService.getActive());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Product>> getByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.getByCategory(categoryId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(productService.search(keyword));
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        productService.toggleStatus(id, true);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        productService.toggleStatus(id, false);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
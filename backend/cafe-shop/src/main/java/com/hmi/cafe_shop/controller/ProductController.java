package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.service.ProductService;
import com.hmi.cafe_shop.config.FileConfig;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService s) { this.service = s; }

    @PostMapping("/create")
    public ResponseEntity<Product> create(
            @RequestParam("name") String name, @RequestParam("price") Double price,
            @RequestParam("description") String desc, @RequestParam("categoryId") Long catId,
            @RequestParam("isActive") boolean active, @RequestParam("imageFile") MultipartFile file) throws IOException {
        return ResponseEntity.ok(service.createProduct(name, price, desc, catId, active, file));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Product> update(
            @PathVariable Long id, @RequestParam("name") String name,
            @RequestParam("price") Double price, @RequestParam("description") String desc,
            @RequestParam("categoryId") Long catId, @RequestParam("isActive") boolean active,
            @RequestParam(value = "imageFile", required = false) MultipartFile file) throws IOException {
        return ResponseEntity.ok(service.updateProduct(id, name, price, desc, catId, active, file));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Product>> getAll() { return ResponseEntity.ok(service.getAllProducts()); }

    @GetMapping("/active")
    public ResponseEntity<List<Product>> getActive() { return ResponseEntity.ok(service.getActiveProducts()); }

    @PutMapping("/activate/{id}")
    public ResponseEntity<Void> activate(@PathVariable Long id) { service.toggleStatus(id, true); return ResponseEntity.ok().build(); }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) { service.toggleStatus(id, false); return ResponseEntity.ok().build(); }
}
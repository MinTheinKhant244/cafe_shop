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

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping(value = "/create", consumes = {"multipart/form-data"})
    public ResponseEntity<?> create(
            @ModelAttribute Product product, // @RequestBody အစား @ModelAttribute ပြောင်းသုံးပါသည်
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {
        
        try {
            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = FileConfig.saveFile(imageFile);
                product.setImage(fileName);
            }
            return ResponseEntity.ok(productService.createProduct(product));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        }
    }

    @PutMapping(value = "/update/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> update(
            @ModelAttribute Product product,
            @PathVariable Long id,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {
        
        try {
            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = FileConfig.saveFile(imageFile);
                product.setImage(fileName); // ပုံအသစ်ရောက်လာရင် နာမည်အသစ်နဲ့ လဲမည်
            }
            return ResponseEntity.ok(productService.updateProduct(product, id));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update image: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Product>> getAll() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Product>> getByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok("Product Deleted Successfully");
    }
}
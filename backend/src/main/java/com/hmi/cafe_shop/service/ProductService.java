package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Product;
import java.util.List;
import java.util.Optional;

public interface ProductService {
    Product createProduct(Product product);
    Optional<Product> getProductById(Long id);
    List<Product> getAllProducts();
    List<Product> getProductsByCategory(Long categoryId);
    Product updateProduct(Product product, Long id);
    void deleteProduct(Long id);
}
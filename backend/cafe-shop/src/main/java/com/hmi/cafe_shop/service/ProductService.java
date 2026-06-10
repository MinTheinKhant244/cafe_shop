package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Product;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface ProductService {
    Product createProduct(String name, Double price, String desc, Long catId, boolean active, MultipartFile file) throws IOException;
    Product updateProduct(Long id, String name, Double price, String desc, Long catId, boolean active, MultipartFile file) throws IOException;
    List<Product> getAllProducts();    
    List<Product> getActiveProducts();
    void toggleStatus(Long id, boolean status);
    
    List<Product> getProductsByCategory(Long categoryId);
    List<Product> searchProducts(String keyword);
//    Page<Product> getProductsPaginated(int page, int size);
    Product getProductById(Long id);
	
}
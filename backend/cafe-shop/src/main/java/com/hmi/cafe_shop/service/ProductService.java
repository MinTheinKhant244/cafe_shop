package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Product;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ProductService {

    Product create(String name, Double price, String desc,
                   Long categoryId, Boolean active,
                   MultipartFile file) throws IOException;

    Product update(Long id, String name, Double price, String desc,
                   Long categoryId, Boolean active,
                   MultipartFile file) throws IOException;

    Product getById(Long id);

    List<Product> getAll();

    List<Product> getActive();

    List<Product> getByCategory(Long categoryId);

    List<Product> search(String keyword);

    void toggleStatus(Long id, boolean status);

    void delete(Long id);
}
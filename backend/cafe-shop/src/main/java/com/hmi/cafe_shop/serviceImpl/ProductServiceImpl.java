package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.config.FileConfig;
import com.hmi.cafe_shop.entity.Category;
import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.repository.CategoryRepository;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public Product create(String name, Double price, String desc,
                          Long categoryId, Boolean active,
                          MultipartFile file) throws IOException {

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        String fileName = (file != null && !file.isEmpty())
                ? FileConfig.saveFile(file)
                : null;

        Product p = new Product();
        p.setName(name);
        p.setPrice(price);
        p.setDescription(desc);
        p.setCategory(category);
        p.setIsActive(active != null ? active : true);
        p.setImage(fileName);

        return productRepository.save(p);
    }

    @Override
    public Product update(Long id, String name, Double price, String desc,
                          Long categoryId, Boolean active,
                          MultipartFile file) throws IOException {

        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        p.setName(name);
        p.setPrice(price);
        p.setDescription(desc);
        p.setCategory(category);

        if (active != null) {
            p.setIsActive(active);
        }

        if (file != null && !file.isEmpty()) {
            String fileName = FileConfig.saveFile(file);
            p.setImage(fileName);
        }

        return productRepository.save(p);
    }

    @Override
    public Product getById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Override
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    @Override
    public List<Product> getActive() {
        return productRepository.findByIsActiveTrue();
    }

    @Override
    public List<Product> getByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    @Override
    public List<Product> search(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword);
    }

    @Override
    public void toggleStatus(Long id, boolean status) {
        Product p = getById(id);
        p.setIsActive(status);
        productRepository.save(p);
    }

    @Override
    public void delete(Long id) {
        productRepository.deleteById(id);
    }
}
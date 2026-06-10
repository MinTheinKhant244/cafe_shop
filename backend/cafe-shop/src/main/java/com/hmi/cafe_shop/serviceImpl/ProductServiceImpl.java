package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.service.ProductService;
import org.springframework.stereotype.Service;
import java.util.List;
import com.hmi.cafe_shop.config.FileConfig;
import com.hmi.cafe_shop.entity.Category;
import com.hmi.cafe_shop.repository.CategoryRepository;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Product createProduct(String name, Double price, String desc, Long catId, boolean active, MultipartFile file) throws IOException {
        String fileName = FileConfig.saveFile(file);

        Category cat = categoryRepository.findById(catId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Product p = new Product();
        p.setName(name);
        p.setPrice(price);
        p.setDescription(desc);
        p.setCategory(cat);
        p.setIsActive(active);
        p.setImage(fileName);
        
        return productRepository.save(p);
    }

    @Override
    public Product updateProduct(Long id, String name, Double price, String desc, Long catId, boolean active, MultipartFile file) throws IOException {
        Product p = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));
        
        p.setName(name);
        p.setPrice(price);
        p.setDescription(desc);
        p.setCategory(categoryRepository.findById(catId).orElseThrow());
        p.setIsActive(active);

        // ဖိုင်အသစ်တင်မှသာ ပုံကို အစားထိုးခြင်း
        if (file != null && !file.isEmpty()) {
            String fileName = FileConfig.saveFile(file);
            p.setImage(fileName);
        }

        return productRepository.save(p);
    }

    
    @Override
    public List<Product> getAllProducts() { 
        return productRepository.findAll(); 
    }

    @Override
    public List<Product> getActiveProducts() { 
        return productRepository.findByIsActiveTrue(); 
    }
    @Override
    public void toggleStatus(Long id, boolean status) {
        Product p = productRepository.findById(id).orElseThrow();
        p.setIsActive(status);
        productRepository.save(p);
    }
    
    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Override
    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    @Override
    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword);
    }

//    @Override
//    public Page<Product> getProductsPaginated(int page, int size) {
//        return productRepository.findAll(PageRequest.of(page, size, Sort.by("name").ascending()));
//    }
    
}
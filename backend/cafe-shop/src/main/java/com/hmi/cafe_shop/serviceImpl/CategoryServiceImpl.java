package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Category;
import com.hmi.cafe_shop.repository.CategoryRepository;
import com.hmi.cafe_shop.service.CategoryService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Category createCategory(Category category) { return categoryRepository.save(category); }

    @Override
    public Category updateCategory(Category category, Long id) {
        Category cat = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        cat.setName(category.getName());
        cat.setDescription(category.getDescription());
        cat.setIsActive(category.getIsActive());
        return categoryRepository.save(cat);
    }

    @Override
    public void activateCategory(Long id) {
        Category cat = categoryRepository.findById(id).orElseThrow();
        cat.setIsActive(true);
        categoryRepository.save(cat);
    }

    @Override
    public void deactivateCategory(Long id) {
        Category cat = categoryRepository.findById(id).orElseThrow();
        cat.setIsActive(false);
        categoryRepository.save(cat);
    }

    @Override
    public List<Category> getActiveCategories() {
        return categoryRepository.findByIsActiveTrue();
    }
    
    @Override public List<Category> getAllCategories() { 
    	return categoryRepository.findAll(); 
    }
    
    @Override
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    @Override
    public List<Category> searchCategories(String keyword) {
        return categoryRepository.findByNameContainingIgnoreCase(keyword);
    }

}
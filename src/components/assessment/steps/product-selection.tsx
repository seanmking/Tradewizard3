'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAssessment } from '@/contexts/assessment-context';
import { cn } from '@/utils/cn';
import type { Product } from '@/contexts/assessment-context';

export function ProductSelectionStep() {
  const { state, dispatch } = useAssessment();
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>(
    state.selectedProducts || []
  );
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: '',
    description: '',
    category: '',
  });

  // Initialize with products from business profile if available
  React.useEffect(() => {
    const profileProducts = state.businessProfile?.products;
    
    if (profileProducts && profileProducts.length > 0 && selectedProducts.length === 0) {
      // Create new products with generated IDs
      const extractedProducts: Product[] = profileProducts.map(p => {
        return {
          id: `product-${Math.random().toString(36).substr(2, 9)}`,
          name: p.name,
          description: p.description || '',
          category: p.category || 'Uncategorized',
          specifications: p.specifications || {}
        };
      });
      
      setSelectedProducts(extractedProducts);
    }
  }, [state.businessProfile, selectedProducts.length]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category) return;

    const product: Product = {
      id: `product-${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description || '',
      category: newProduct.category,
      specifications: {},
    };

    setSelectedProducts([...selectedProducts, product]);
    setNewProduct({ name: '', description: '', category: '' });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const handleNext = () => {
    if (selectedProducts.length === 0) return;

    dispatch({ type: 'SET_SELECTED_PRODUCTS', payload: selectedProducts });
    dispatch({ type: 'SET_STEP', payload: 3 }); // Move to next step
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Product Selection</h2>
        <p className="mt-2 text-gray-600">
          Select the products you're interested in exporting. You can add multiple products and
          provide details about each one.
        </p>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Selected Products</h3>
        
        {selectedProducts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No products selected yet</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {selectedProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
                {product.description && (
                  <p className="mt-2 text-sm text-gray-600">{product.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Form */}
      <div className="p-6 rounded-lg border border-gray-200 bg-gray-50 space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Add New Product</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <input
              id="product-name"
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>
          
          <div>
            <label htmlFor="product-category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <input
              id="product-category"
              type="text"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="product-description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="product-description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              rows={3}
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAddProduct}
            disabled={!newProduct.name || !newProduct.category}
            className={cn(
              'px-6 py-2.5 rounded-lg font-medium transition-colors',
              'bg-primary text-white hover:bg-primary/90',
              'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
            )}
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          disabled={selectedProducts.length === 0}
          className={cn(
            'px-8 py-3 rounded-lg font-medium transition-colors',
            'bg-primary text-white hover:bg-primary/90',
            'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
          )}
        >
          Continue to Production & Market
        </button>
      </div>

      {/* Marketing Hook */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100"
      >
        <h3 className="text-sm font-semibold text-blue-900">Why this matters</h3>
        <p className="mt-1 text-sm text-blue-700">
          Carefully selecting and documenting your products helps us identify their unique selling
          points and potential in international markets. This information will be crucial for
          developing your export strategy and meeting international standards.
        </p>
      </motion.div>
    </div>
  );
} 
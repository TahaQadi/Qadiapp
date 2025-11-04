#!/usr/bin/env tsx

import { db } from '../db.js';
import { products, ltaProducts } from '../../shared/schema.js';
import { storage } from '../storage.js';
import { eq, like, or, sql, inArray } from 'drizzle-orm';

async function removeStressTestProducts() {
  console.log('🧹 Removing stress test products...\n');
  console.log('='.repeat(60));
  console.log('This will delete products matching stress test patterns:');
  console.log('  • SKU starting with "STRESS-"');
  console.log('  • SKU starting with "STRESS-CONCURRENT-"');
  console.log('  • SKU starting with "MIXED-"');
  console.log('  • Description containing "Stress test product"');
  console.log('  • Description containing "Test product description"');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Find all stress test products
    console.log('📋 Step 1: Finding stress test products...');
    
    const allProducts = await db.select().from(products);
    console.log(`   📊 Total products in database: ${allProducts.length}`);
    
    // Filter products matching stress test patterns
    const stressTestProducts = allProducts.filter(product => {
      const sku = product.sku?.toUpperCase() || '';
      const description = (product.description || '').toLowerCase();
      
      return (
        sku.startsWith('STRESS-') ||
        sku.startsWith('STRESS-CONCURRENT-') ||
        sku.startsWith('MIXED-') ||
        description.includes('stress test product') ||
        description.includes('test product description')
      );
    });
    
    console.log(`   📊 Found ${stressTestProducts.length} stress test products`);
    
    if (stressTestProducts.length === 0) {
      console.log('   ℹ️  No stress test products found. Nothing to delete.');
      console.log('');
      return;
    }
    
    // Display products to be deleted
    console.log('\n   Products to be deleted (showing first 20):');
    stressTestProducts.slice(0, 20).forEach((product, index) => {
      console.log(`   ${index + 1}. SKU: ${product.sku} | Name: ${product.name || 'N/A'}`);
    });
    if (stressTestProducts.length > 20) {
      console.log(`   ... and ${stressTestProducts.length - 20} more products`);
    }
    console.log('');
    
    // Step 2: Delete LTA product relationships first
    console.log('🗑️  Step 2: Deleting LTA product relationships...');
    const productIds = stressTestProducts.map(p => p.id);
    
    if (productIds.length > 0) {
      // Find all LTA product relationships for these products
      const ltaProductRelations = await db.select().from(ltaProducts)
        .where(inArray(ltaProducts.productId, productIds));
      
      if (ltaProductRelations.length > 0) {
        console.log(`   📊 Found ${ltaProductRelations.length} LTA product relationships`);
        await db.delete(ltaProducts).where(inArray(ltaProducts.productId, productIds));
        console.log(`   ✅ Deleted ${ltaProductRelations.length} LTA product relationships`);
      } else {
        console.log('   ℹ️  No LTA product relationships found');
      }
    }
    console.log('');
    
    // Step 3: Delete the products
    console.log('🗑️  Step 3: Deleting stress test products...');
    
    let deletedCount = 0;
    const totalProducts = stressTestProducts.length;
    
    // Delete in batches to avoid overwhelming the console
    const batchSize = 50;
    for (let i = 0; i < stressTestProducts.length; i += batchSize) {
      const batch = stressTestProducts.slice(i, i + batchSize);
      for (const product of batch) {
        try {
          await storage.deleteProduct(product.id);
          deletedCount++;
        } catch (error) {
          console.error(`   ❌ Error deleting ${product.sku}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      console.log(`   ✅ Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalProducts / batchSize)} (${deletedCount}/${totalProducts} products)`);
    }
    
    console.log('');
    console.log(`✅ SUCCESS! Deleted ${deletedCount}/${stressTestProducts.length} stress test products\n`);
    
    // Verification
    console.log('🔍 Verifying deletion...');
    const remainingProducts = await db.select().from(products);
    const remainingStressProducts = remainingProducts.filter(product => {
      const sku = product.sku?.toUpperCase() || '';
      const description = (product.description || '').toLowerCase();
      
      return (
        sku.startsWith('STRESS-') ||
        sku.startsWith('STRESS-CONCURRENT-') ||
        sku.startsWith('MIXED-') ||
        description.includes('stress test product') ||
        description.includes('test product description')
      );
    });
    
    console.log(`   📊 Remaining products: ${remainingProducts.length}`);
    console.log(`   📊 Remaining stress test products: ${remainingStressProducts.length}`);
    
    if (remainingStressProducts.length === 0) {
      console.log('   ✅ All stress test products have been removed!\n');
    } else {
      console.log('   ⚠️  Some stress test products may still remain:\n');
      remainingStressProducts.forEach(product => {
        console.log(`      • ${product.sku} - ${product.name || 'N/A'}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

removeStressTestProducts();


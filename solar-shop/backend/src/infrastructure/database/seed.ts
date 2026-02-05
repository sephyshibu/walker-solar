import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from './models/UserModel';
import { ProductModel } from './models/ProductModel';
import { GalleryModel } from './models/GalleryModel';
import { CategoryModel } from './models/CategoryModel';
import { UserRole, UserStatus } from '../../domain/entities/User';
import { ProductStatus } from '../../domain/entities/Product';
import { GalleryCategory } from '../../domain/entities/Gallery';
import { CategoryStatus } from '../../domain/entities/Category';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/solar_ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing data
    await UserModel.deleteMany({});
    await ProductModel.deleteMany({});
    await GalleryModel.deleteMany({});
    await CategoryModel.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Jithin1996@', 12);
    await UserModel.create({
      email: process.env.ADMIN_EMAIL || 'admin@walkers.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Walkers',
      phone: '+91 9876543210',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    });
    console.log('Admin user created');

    // Create sample user
    const userPassword = await bcrypt.hash('User@123', 12);
    await UserModel.create({
      email: 'user@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+91 9876543211',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      address: {
        street: '123 Solar Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        zipCode: '600001',
        country: 'India'
      }
    });
    console.log('Sample user created');

    // Create categories
    const solarPanelsCategory = await CategoryModel.create({
      name: 'Solar Panels',
      slug: 'solar_panels',
      description: 'High-efficiency solar panels for residential and commercial use',
      status: CategoryStatus.ACTIVE,
      sortOrder: 1,
      productCount: 0
    });

    const invertersCategory = await CategoryModel.create({
      name: 'Inverters',
      slug: 'inverters',
      description: 'Solar inverters and power conversion systems',
      status: CategoryStatus.ACTIVE,
      sortOrder: 2,
      productCount: 0
    });

    const batteriesCategory = await CategoryModel.create({
      name: 'Batteries',
      slug: 'batteries',
      description: 'Energy storage solutions and battery systems',
      status: CategoryStatus.ACTIVE,
      sortOrder: 3,
      productCount: 0
    });

    const chargeControllersCategory = await CategoryModel.create({
      name: 'Charge Controllers',
      slug: 'charge_controllers',
      description: 'MPPT and PWM charge controllers',
      status: CategoryStatus.ACTIVE,
      sortOrder: 4,
      productCount: 0
    });

    const mountingSystemsCategory = await CategoryModel.create({
      name: 'Mounting Systems',
      slug: 'mounting_systems',
      description: 'Mounting rails, clamps, and installation hardware',
      status: CategoryStatus.ACTIVE,
      sortOrder: 5,
      productCount: 0
    });

    const cablesConnectorsCategory = await CategoryModel.create({
      name: 'Cables & Connectors',
      slug: 'cables_connectors',
      description: 'Solar cables, MC4 connectors, and wiring accessories',
      status: CategoryStatus.ACTIVE,
      sortOrder: 6,
      productCount: 0
    });

    const accessoriesCategory = await CategoryModel.create({
      name: 'Accessories',
      slug: 'accessories',
      description: 'Solar system accessories and maintenance tools',
      status: CategoryStatus.ACTIVE,
      sortOrder: 7,
      productCount: 0
    });

    console.log('Categories created');

    // Create sample products using category IDs
    const sampleProducts = [
      {
        name: 'Mono PERC Solar Panel 545W',
        slug: 'mono-perc-solar-panel-545w',
        description: 'High-efficiency monocrystalline PERC solar panel with 545W output. Ideal for residential and commercial installations. Features half-cell technology for better performance in partial shading conditions.',
        shortDescription: 'High-efficiency 545W monocrystalline solar panel with PERC technology',
        category: solarPanelsCategory._id.toString(),
        price: 18500,
        discountPrice: 16999,
        images: ['/uploads/products/solar-panel-1.jpg'],
        specifications: [
          { key: 'Power Output', value: '545', unit: 'W' },
          { key: 'Efficiency', value: '21.3', unit: '%' },
          { key: 'Cell Type', value: 'Mono PERC', unit: '' },
          { key: 'Dimensions', value: '2278 x 1134 x 35', unit: 'mm' },
          { key: 'Weight', value: '28.5', unit: 'kg' }
        ],
        features: [
          'Half-cell technology for improved performance',
          'Anti-reflective glass coating',
          '25-year linear power warranty',
          'IP68 junction box rating',
          'Salt mist and ammonia corrosion resistant'
        ],
        stock: 150,
        sku: 'SP-MONO-545W',
        brand: 'SolarMax',
        warranty: '25 years',
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        viewCount: 245
      },
      {
        name: 'Hybrid Solar Inverter 5KW',
        slug: 'hybrid-solar-inverter-5kw',
        description: 'Advanced hybrid solar inverter with 5KW capacity. Supports both on-grid and off-grid operation. Built-in MPPT charge controller and WiFi monitoring.',
        shortDescription: 'Smart 5KW hybrid inverter with WiFi monitoring',
        category: invertersCategory._id.toString(),
        price: 65000,
        discountPrice: 58500,
        images: ['/uploads/products/inverter-1.jpg'],
        specifications: [
          { key: 'Rated Power', value: '5000', unit: 'W' },
          { key: 'Max PV Input', value: '6500', unit: 'W' },
          { key: 'Battery Voltage', value: '48', unit: 'V' },
          { key: 'MPPT Channels', value: '2', unit: '' },
          { key: 'Efficiency', value: '97.6', unit: '%' }
        ],
        features: [
          'Pure sine wave output',
          'Built-in 80A MPPT controller',
          'WiFi monitoring via mobile app',
          'Parallel operation support',
          'Generator input compatible'
        ],
        stock: 45,
        sku: 'INV-HYB-5KW',
        brand: 'PowerTech',
        warranty: '5 years',
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        viewCount: 189
      },
      {
        name: 'Lithium Battery 48V 100Ah',
        slug: 'lithium-battery-48v-100ah',
        description: 'Premium lithium iron phosphate (LiFePO4) battery with 48V 100Ah capacity. Safe, long-lasting, and maintenance-free. Perfect for solar energy storage systems.',
        shortDescription: 'Safe and efficient 48V 100Ah LiFePO4 battery',
        category: batteriesCategory._id.toString(),
        price: 125000,
        discountPrice: 115000,
        images: ['/uploads/products/battery-1.jpg'],
        specifications: [
          { key: 'Voltage', value: '48', unit: 'V' },
          { key: 'Capacity', value: '100', unit: 'Ah' },
          { key: 'Energy', value: '4.8', unit: 'kWh' },
          { key: 'Cycle Life', value: '6000+', unit: 'cycles' },
          { key: 'Weight', value: '45', unit: 'kg' }
        ],
        features: [
          'Built-in BMS protection',
          '6000+ cycle life at 80% DOD',
          'RS485/CAN communication',
          'Stackable design',
          'Wide temperature range operation'
        ],
        stock: 30,
        sku: 'BAT-LIFEPO4-48100',
        brand: 'EnergyCell',
        warranty: '10 years',
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        viewCount: 312
      },
      {
        name: 'MPPT Charge Controller 60A',
        slug: 'mppt-charge-controller-60a',
        description: 'High-performance MPPT solar charge controller with 60A capacity. Advanced tracking algorithm for maximum power harvest. LCD display with comprehensive system monitoring.',
        shortDescription: 'Efficient 60A MPPT charge controller with LCD',
        category: chargeControllersCategory._id.toString(),
        price: 12500,
        discountPrice: 10999,
        images: ['/uploads/products/controller-1.jpg'],
        specifications: [
          { key: 'Max Charge Current', value: '60', unit: 'A' },
          { key: 'Max PV Input', value: '150', unit: 'V' },
          { key: 'System Voltage', value: '12/24/48', unit: 'V Auto' },
          { key: 'Efficiency', value: '99', unit: '%' },
          { key: 'Self Consumption', value: '<1', unit: 'W' }
        ],
        features: [
          '99% MPPT tracking efficiency',
          'Multi-stage charging algorithm',
          'Temperature compensation',
          'RS485/Bluetooth communication',
          'IP32 protection rating'
        ],
        stock: 80,
        sku: 'CC-MPPT-60A',
        brand: 'SolarMax',
        warranty: '3 years',
        status: ProductStatus.ACTIVE,
        isFeatured: false,
        viewCount: 156
      },
      {
        name: 'Solar Panel Mounting Rail 4.2m',
        slug: 'solar-panel-mounting-rail-4-2m',
        description: 'Heavy-duty aluminum mounting rail for solar panel installation. 4.2 meters length, suitable for residential and commercial rooftop installations.',
        shortDescription: 'Premium 4.2m aluminum mounting rail',
        category: mountingSystemsCategory._id.toString(),
        price: 2200,
        images: ['/uploads/products/mounting-1.jpg'],
        specifications: [
          { key: 'Length', value: '4200', unit: 'mm' },
          { key: 'Material', value: 'Aluminum 6005-T5', unit: '' },
          { key: 'Load Capacity', value: '250', unit: 'kg/m' },
          { key: 'Profile Height', value: '40', unit: 'mm' }
        ],
        features: [
          'Anodized aluminum finish',
          'Pre-drilled mounting holes',
          'Compatible with all clamp types',
          'Corrosion resistant',
          '25-year structural warranty'
        ],
        stock: 200,
        sku: 'MT-RAIL-42',
        brand: 'MountPro',
        warranty: '25 years',
        status: ProductStatus.ACTIVE,
        isFeatured: false,
        viewCount: 89
      },
      {
        name: 'Solar MC4 Connector Pair',
        slug: 'solar-mc4-connector-pair',
        description: 'Professional grade MC4 solar connectors for secure panel connections. IP67 rated, suitable for outdoor use. Male and female pair included.',
        shortDescription: 'IP67 rated MC4 connector pair',
        category: cablesConnectorsCategory._id.toString(),
        price: 150,
        images: ['/uploads/products/mc4-1.jpg'],
        specifications: [
          { key: 'Current Rating', value: '30', unit: 'A' },
          { key: 'Voltage Rating', value: '1000', unit: 'V DC' },
          { key: 'IP Rating', value: 'IP67', unit: '' },
          { key: 'Wire Size', value: '2.5-6', unit: 'mm²' }
        ],
        features: [
          'TUV certified',
          'Tool-free assembly',
          'UV resistant housing',
          'Silver-plated contacts',
          '25-year lifespan'
        ],
        stock: 500,
        sku: 'CN-MC4-PAIR',
        brand: 'SolarMax',
        warranty: '10 years',
        status: ProductStatus.ACTIVE,
        isFeatured: false,
        viewCount: 234
      },
      {
        name: 'Solar Panel Cleaning Kit',
        slug: 'solar-panel-cleaning-kit',
        description: 'Complete solar panel cleaning kit with extendable pole, soft brush head, and squeegee. Keeps your panels at peak efficiency.',
        shortDescription: 'Professional solar panel cleaning kit',
        category: accessoriesCategory._id.toString(),
        price: 3500,
        images: ['/uploads/products/cleaning-kit-1.jpg'],
        specifications: [
          { key: 'Pole Length', value: '1.8-5.4', unit: 'm' },
          { key: 'Brush Width', value: '35', unit: 'cm' },
          { key: 'Material', value: 'Aluminum + Nylon', unit: '' }
        ],
        features: [
          'Extendable aluminum pole',
          'Soft bristle brush head',
          'Integrated water channel',
          'Squeegee attachment included',
          'Lightweight design'
        ],
        stock: 75,
        sku: 'AC-CLEAN-KIT',
        brand: 'CleanSolar',
        warranty: '1 year',
        status: ProductStatus.ACTIVE,
        isFeatured: false,
        viewCount: 67
      },
      {
        name: 'Bifacial Solar Panel 450W',
        slug: 'bifacial-solar-panel-450w',
        description: 'Premium bifacial solar panel that generates power from both sides. Up to 30% additional energy gain from rear side. Perfect for ground mount and elevated installations.',
        shortDescription: 'Dual-sided 450W bifacial solar panel',
        category: solarPanelsCategory._id.toString(),
        price: 22000,
        discountPrice: 19500,
        images: ['/uploads/products/bifacial-1.jpg'],
        specifications: [
          { key: 'Front Power', value: '450', unit: 'W' },
          { key: 'Bifaciality', value: '70', unit: '%' },
          { key: 'Cell Type', value: 'N-Type TOPCon', unit: '' },
          { key: 'Efficiency', value: '22.1', unit: '%' }
        ],
        features: [
          'Transparent backsheet',
          'N-type TOPCon cells',
          'Up to 30% energy gain',
          'Enhanced low-light performance',
          '30-year warranty'
        ],
        stock: 60,
        sku: 'SP-BIFI-450W',
        brand: 'SolarMax',
        warranty: '30 years',
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        viewCount: 178
      }
    ];

    // Create products
    await ProductModel.insertMany(sampleProducts);
    console.log('Sample products created');

    // Update category product counts
    await CategoryModel.findByIdAndUpdate(solarPanelsCategory._id, { productCount: 2 });
    await CategoryModel.findByIdAndUpdate(invertersCategory._id, { productCount: 1 });
    await CategoryModel.findByIdAndUpdate(batteriesCategory._id, { productCount: 1 });
    await CategoryModel.findByIdAndUpdate(chargeControllersCategory._id, { productCount: 1 });
    await CategoryModel.findByIdAndUpdate(mountingSystemsCategory._id, { productCount: 1 });
    await CategoryModel.findByIdAndUpdate(cablesConnectorsCategory._id, { productCount: 1 });
    await CategoryModel.findByIdAndUpdate(accessoriesCategory._id, { productCount: 1 });

    // Create sample gallery items
    const sampleGallery = [
      {
        title: 'Residential Rooftop Installation',
        description: '10kW solar system installed on a family home in Chennai',
        imageUrl: '/uploads/gallery/installation-1.jpg',
        category: GalleryCategory.INSTALLATIONS,
        tags: ['residential', 'rooftop', '10kW'],
        isActive: true,
        sortOrder: 1
      },
      {
        title: 'Commercial Solar Project',
        description: '50kW ground-mounted solar farm for local business',
        imageUrl: '/uploads/gallery/installation-2.jpg',
        category: GalleryCategory.INSTALLATIONS,
        tags: ['commercial', 'ground-mount', '50kW'],
        isActive: true,
        sortOrder: 2
      },
      {
        title: 'Battery Storage Setup',
        description: 'Complete energy storage solution with lithium batteries',
        imageUrl: '/uploads/gallery/project-1.jpg',
        category: GalleryCategory.PROJECTS,
        tags: ['battery', 'storage', 'lithium'],
        isActive: true,
        sortOrder: 3
      }
    ];

    await GalleryModel.insertMany(sampleGallery);
    console.log('Sample gallery items created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nAdmin Credentials:');
    console.log(`Email: ${process.env.ADMIN_EMAIL || 'admin@walkers.com'}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || 'Jithin1996@'}`);
    console.log('\nSample User Credentials:');
    console.log('Email: user@example.com');
    console.log('Password: User@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
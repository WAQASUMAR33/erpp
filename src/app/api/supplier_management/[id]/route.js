import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    if (!prisma.supplier) {
      console.error('Prisma Supplier model is undefined');
      return NextResponse.json({ error: 'Supplier model not found' }, { status: 500 });
    }

    const supplierId = parseInt(params.id);
    if (isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        products: { select: { product_id: true } },
        ledger_entries: { select: { id: true } },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier, { status: 200 });
  } catch (error) {
    console.error('Get supplier error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const supplierId = parseInt(params.id);
    if (isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const data = await request.json();
    const {
      supplier_name,
      contact_name,
      email,
      phone,
      address,
      bank_name,
      bank_accountno,
      balance,
      tax_id,
      payment_terms,
      status,
    } = data;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Validate fields
    if (supplier_name !== undefined) {
      if (typeof supplier_name !== 'string' || supplier_name.trim().length === 0) {
        return NextResponse.json({ error: 'Supplier name must be a non-empty string' }, { status: 400 });
      }
      if (supplier_name.trim().length > 255) {
        return NextResponse.json({ error: 'Supplier name exceeds 255 characters' }, { status: 400 });
      }
    }
    if (contact_name !== undefined && contact_name !== null && (typeof contact_name !== 'string' || contact_name.length > 255)) {
      return NextResponse.json({ error: 'Contact name must be a string with max 255 characters' }, { status: 400 });
    }
    if (email !== undefined) {
      if (email !== null && (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }
    if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 50)) {
      return NextResponse.json({ error: 'Phone must be a string with max 50 characters' }, { status: 400 });
    }
    if (address !== undefined && address !== null && typeof address !== 'string') {
      return NextResponse.json({ error: 'Address must be a string' }, { status: 400 });
    }
    if (bank_name !== undefined && bank_name !== null && (typeof bank_name !== 'string' || bank_name.length > 50)) {
      return NextResponse.json({ error: 'Bank name must be a string with max 50 characters' }, { status: 400 });
    }
    if (bank_accountno !== undefined && bank_accountno !== null && (typeof bank_accountno !== 'string' || bank_accountno.length > 50)) {
      return NextResponse.json({ error: 'Bank account number must be a string with max 50 characters' }, { status: 400 });
    }
    if (balance !== undefined && (typeof balance !== 'number' || isNaN(balance))) {
      return NextResponse.json({ error: 'Balance must be a valid number' }, { status: 400 });
    }
    if (tax_id !== undefined && tax_id !== null && (typeof tax_id !== 'string' || tax_id.length > 50)) {
      return NextResponse.json({ error: 'Tax ID must be a string with max 50 characters' }, { status: 400 });
    }
    if (payment_terms !== undefined && payment_terms !== null && (typeof payment_terms !== 'string' || payment_terms.length > 50)) {
      return NextResponse.json({ error: 'Payment terms must be a string with max 50 characters' }, { status: 400 });
    }
    if (status !== undefined && (typeof status !== 'string' || !['Active', 'Inactive'].includes(status))) {
      return NextResponse.json({ error: 'Status must be "Active" or "Inactive"' }, { status: 400 });
    }

    // Check for duplicates
    if (supplier_name || email) {
      const duplicateSupplier = await prisma.supplier.findFirst({
        where: {
          OR: [
            supplier_name ? { supplier_name: supplier_name.trim() } : undefined,
            email ? { email: email.trim() } : undefined,
          ].filter(Boolean),
          NOT: { id: supplierId },
        },
      });
      if (duplicateSupplier) {
        return NextResponse.json(
          { error: duplicateSupplier.supplier_name === supplier_name?.trim() ? 'Supplier name already exists' : 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Update supplier
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        supplier_name: supplier_name ? supplier_name.trim() : existingSupplier.supplier_name,
        contact_name: contact_name !== undefined ? contact_name : existingSupplier.contact_name,
        email: email !== undefined ? email : existingSupplier.email,
        phone: phone !== undefined ? phone : existingSupplier.phone,
        address: address !== undefined ? address : existingSupplier.address,
        bank_name: bank_name !== undefined ? bank_name : existingSupplier.bank_name,
        bank_accountno: bank_accountno !== undefined ? bank_accountno : existingSupplier.bank_accountno,
        balance: parseFloat(balance)  !== undefined ? parseFloat(balance)  : existingSupplier.balance,
        tax_id: tax_id !== undefined ? tax_id : existingSupplier.tax_id,
        payment_terms: payment_terms !== undefined ? payment_terms : existingSupplier.payment_terms,
        status: status !== undefined ? status : existingSupplier.status,
      },
      include: {
        products: { select: { product_id: true } },
        ledger_entries: { select: { id: true } },
      },
    });

    return NextResponse.json(
      { supplier, message: 'Supplier updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update supplier error:', error.message, error.stack);
    return NextResponse.json({ message: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supplierId = parseInt(params.id);
    if (isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        products: true,
        ledger_entries: true,
      },
    });
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Check for dependencies
    if (supplier.products.length > 0 || supplier.ledger_entries.length > 0) {
      return NextResponse.json({ error: 'Cannot delete supplier with associated products or ledger entries' }, { status: 409 });
    }

    // Delete supplier
    await prisma.supplier.delete({
      where: { id: supplierId },
    });

    return NextResponse.json({ message: 'Supplier deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete supplier error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
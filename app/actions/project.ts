'use server';

import { revalidatePath } from 'next/cache';
import { addProject, updateProject, getProject } from '@/db/actions';

export async function createProjectAction(formData: FormData) {
  try {
    const customerId = formData.get('customer_id') as string;
    const profileId = formData.get('profile_id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const totalAmount = parseFloat(formData.get('total_amount') as string);
    const installmentAmount = parseFloat(formData.get('installment_amount') as string);
    const startDate = formData.get('start_date') as string;
    const endDate = formData.get('end_date') as string;

    if (!customerId || !profileId || !name || !totalAmount || !installmentAmount || !startDate) {
      throw new Error('Missing required fields');
    }

    const projectData = {
      customer_id: customerId,
      profile_id: profileId,
      name,
      description: description || null,
      total_amount: totalAmount,
      installment_amount: installmentAmount,
      start_date: startDate,
      end_date: endDate || null,
      is_active: true
    };

    const projectId = await addProject(projectData);

    // Revalidate relevant pages
    revalidatePath('/customers');
    revalidatePath('/projects');
    revalidatePath(`/customers/${customerId}`);
    revalidatePath('/');

    return { success: true, projectId };
  } catch (error) {
    console.error('Failed to create project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    };
  }
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const totalAmount = parseFloat(formData.get('total_amount') as string);
    const installmentAmount = parseFloat(formData.get('installment_amount') as string);
    const startDate = formData.get('start_date') as string;
    const endDate = formData.get('end_date') as string;
    const isActive = formData.get('is_active') === 'true';

    if (!name || !totalAmount || !installmentAmount || !startDate) {
      throw new Error('Missing required fields');
    }

    const updateData = {
      name,
      description: description || null,
      total_amount: totalAmount,
      installment_amount: installmentAmount,
      start_date: startDate,
      end_date: endDate || null,
      is_active: isActive
    };

    await updateProject(projectId, updateData);

    // Get project to revalidate customer page
    const project = await getProject(projectId);
    
    // Revalidate relevant pages
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    if (project) {
      revalidatePath(`/customers/${project.customer_id}`);
    }
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to update project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update project' 
    };
  }
}

export async function toggleProjectStatus(projectId: string) {
  try {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    await updateProject(projectId, { is_active: !project.is_active });

    // Revalidate relevant pages
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/customers/${project.customer_id}`);
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to toggle project status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update project status' 
    };
  }
}
'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { getProjects } from '@/db/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Loading, SkeletonList } from '@/components/Loading';
import { PullToRefresh } from '@/components/PullToRefresh';
import { 
  FolderOpen, 
  Plus, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  User,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Project = {
  id: string;
  customer_id: string;
  profile_id: string;
  name: string;
  description: string | null;
  total_amount: number;
  installment_amount: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  paid_amount?: number;
  remaining_amount?: number;
  progress_percentage?: number;
};

export default function ProjectsPage() {
  const { currentProfile } = useProfile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    if (!currentProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getProjects(currentProfile.id);
      setProjects(result);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [currentProfile]);

  const getStatusIcon = (project: Project) => {
    if (!project.is_active) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    if ((project.progress_percentage || 0) >= 100) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if ((project.progress_percentage || 0) > 0) return <Clock className="h-4 w-4 text-blue-500" />;
    return <FolderOpen className="h-4 w-4 text-orange-500" />;
  };

  const getStatusText = (project: Project) => {
    if (!project.is_active) return 'Inactive';
    if ((project.progress_percentage || 0) >= 100) return 'Completed';
    if ((project.progress_percentage || 0) > 0) return 'In Progress';
    return 'Not Started';
  };

  const getStatusColor = (project: Project) => {
    if (!project.is_active) return 'text-gray-500 bg-gray-100';
    if ((project.progress_percentage || 0) >= 100) return 'text-green-700 bg-green-100';
    if ((project.progress_percentage || 0) > 0) return 'text-blue-700 bg-blue-100';
    return 'text-orange-700 bg-orange-100';
  };

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading text="Loading Profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadProjects} size="mobile">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadProjects}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-gray-600 mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link href="/projects/add">
            <Button size="mobile" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Project</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>

        {/* Projects List */}
        {loading && projects.length === 0 ? (
          <SkeletonList count={3} />
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first project to get started</p>
            <Link href="/projects/add">
              <Button size="mobile">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} variant="mobile" interactive>
                <Link href={`/projects/${project.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base md:text-lg mb-2">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(project)
                      )}>
                        {getStatusIcon(project)}
                        <span className="hidden sm:inline">{getStatusText(project)}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-gray-600">Collected</p>
                          <p className="font-semibold">{formatCurrency(project.paid_amount || 0)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-gray-600">Remaining</p>
                          <p className="font-semibold">{formatCurrency(project.remaining_amount || 0)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(project.installment_amount)}/installment</span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
import Project from '../models/Project.model.js';
import Team from '../models/Team.model.js';

/**
 * Helper to check if a user has access to a project (as owner OR team member)
 */
export const getProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId).populate('owner', 'name');
  if (!project) return { exists: false };

  // 1. Is the user the direct owner?
  const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
  if (ownerId === userId.toString()) {
    // Even if owner, check if it's linked to any of their teams
    const team = await Team.findOne({ projects: projectId });
    return { exists: true, project, team, canEdit: true, canDelete: true };
  }

  // 2. Is the user a member of a team that has linked this project?
  const team = await Team.findOne({ 
    projects: projectId, 
    'members.user': userId 
  });

  if (team) {
    const member = team.members.find(m => m.user.toString() === userId.toString());
    const isAdmin = member && ['owner', 'admin'].includes(member.role);
    return { 
      exists: true, 
      project, 
      team,
      canEdit: true, 
      canDelete: isAdmin 
    };
  }

  return { exists: true, project, team: null, canEdit: false, canDelete: false };
};

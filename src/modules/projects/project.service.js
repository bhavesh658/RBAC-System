const Project = require('./project.model');
const User = require('../users/user.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const { createActivityLog, } = require('../activity-logs/activityLog.service');
const pagination = require('../../common/pagination');


const createProject = async (
    payload,
    currentUser
) => {
    const project =
        await Project.create({
            ...payload,

            createdBy:
                currentUser._id,
        });

    await createActivityLog({
        module: 'Project',
        action: 'Create',
        description:
            `${currentUser.fullName} created project ${project.name}`,
        recordId: project._id,
        performedBy: currentUser._id,
        metadata: {
            newValue: {
                name: project.name,
                status: project.status,
                priority: project.priority,
            },
        },
    });

    return project;
};



const getAllProjects = async (query = {}) => {
    const { page, limit, skip } = pagination(query);

    const filter = { isDeleted: false, };

    // Optional filters
    if (query.status) {
        filter.status =
            query.status;
    }

    if (query.priority) {
        filter.priority =
            query.priority;
    }

    if (query.projectManager) {
        filter.projectManager =
            query.projectManager;
    }

    const projects =
        await Project.find(filter)

            .populate(
                'projectManager',
                'firstName lastName email'
            )

            .populate(
                'teamMembers',
                'firstName lastName email'
            )

            .populate(
                'createdBy',
                'firstName lastName'
            )

            .populate(
                'updatedBy',
                'firstName lastName'
            )
            .skip(skip)
            .limit(limit)

            .sort({
                createdAt: -1,
            });

    return projects;
};



const getProjectById = async (
    projectId
) => {
    const project =
        await Project.findOne({
            _id: projectId,
            isDeleted: false,
        })

            .populate(
                'projectManager',
                'firstName lastName email'
            )

            .populate(
                'teamMembers',
                'firstName lastName email'
            )

            .populate(
                'createdBy',
                'firstName lastName'
            )

            .populate(
                'updatedBy',
                'firstName lastName'
            );

    if (!project) {
        throw new AppError(
            'Project not found',
            HTTP_STATUS.NOT_FOUND
        );
    }

    return project;
};



const updateProject = async (
    projectId,
    payload,
    currentUser
) => {
    const project =
        await Project.findOne({
            _id: projectId,
            isDeleted: false,
        });

    if (!project) {
        throw new AppError(
            'Project not found',
            HTTP_STATUS.NOT_FOUND
        );
    }
    const oldProject = {
        name: project.name,
        status: project.status,
        priority: project.priority,
        projectManager:
            project.projectManager,
    };
    Object.assign(
        project,
        payload
    );

    project.updatedBy =
        currentUser._id;

    await project.save();

    await createActivityLog({
        module: 'Project',
        action: 'Update',
        description:
            `${currentUser.fullName} updated project ${project.name}`,
        recordId: project._id,
        performedBy: currentUser._id,
        metadata: {
            previousValue:
                oldProject,

            newValue: {
                name: project.name,
                status: project.status,
                priority: project.priority,
                projectManager:
                    project.projectManager,
            },
        },
    });

    return project;
};



const deleteProject = async (
    projectId,
    currentUser
) => {
    const project =
        await Project.findOne({
            _id: projectId,
            isDeleted: false,
        });

    if (!project) {
        throw new AppError(
            'Project not found',
            HTTP_STATUS.NOT_FOUND
        );
    }

    project.isDeleted = true;

    project.updatedBy =
        currentUser._id;

    await project.save();

    await createActivityLog({
        module: 'Project',

        action: 'Delete',

        description:
            `${currentUser.fullName} deleted project ${project.name}`,

        recordId:
            project._id,

        performedBy:
            currentUser._id,

        metadata: {
            deletedProject: {
                name: project.name,
                status: project.status,
                priority: project.priority,
            },
        },
    });

    return true;
};

const assignTeamMembers = async (
    projectId,
    teamMembers,
    currentUser
) => {

    const project =
        await Project.findOne({
            _id: projectId,
            isDeleted: false,
        });

    if (!project) {
        throw new AppError(
            'Project not found',
            HTTP_STATUS.NOT_FOUND
        );
    }

    // Remove duplicates
    const uniqueMembers = [
        ...new Set([
            ...project.teamMembers.map(
                (member) =>
                    member.toString()
            ),

            ...teamMembers,
        ]),
    ];

    project.teamMembers =
        uniqueMembers;

    project.updatedBy =
        currentUser._id;

    await project.save();

    const users =
        await User.find({
            _id: {
                $in: teamMembers,
            },
        }).select(
            'firstName lastName'
        );

    await createActivityLog({
        module: 'Project',
        action: 'Assign Members',
        description:
            `${currentUser.fullName} assigned team members to ${project.name}`,
        recordId: project._id,
        performedBy: currentUser._id,
        metadata: {
            newValue: {
                members:
                    users.map(
                        (user) => ({
                            id: user._id,
                            name:
                                `${user.firstName} ${user.lastName}`,
                        })
                    ),
            },
        },
    });

    return project;
};

const removeTeamMember = async (
    projectId,
    userId,
    currentUser
) => {

    const project =
        await Project.findOne({
            _id: projectId,
            isDeleted: false,
        });

    if (!project) {
        throw new AppError(
            'Project not found',
            HTTP_STATUS.NOT_FOUND
        );
    }

    project.teamMembers =
        project.teamMembers.filter(
            (member) =>
                member.toString() !==
                userId
        );

    project.updatedBy =
        currentUser._id;

    await project.save();

    const user =
        await User.findById(
            userId
        ).select(
            'firstName lastName'
        );

    await createActivityLog({
        module: 'Project',
        action: 'Remove Member',
        description:
            `${currentUser.fullName} removed a team member from ${project.name}`,
        recordId: project._id,
        performedBy: currentUser._id,
        metadata: {
            removedMember: {
                id: user._id,
                name:
                    `${user.firstName} ${user.lastName}`,
            },
        },
    });

    return project;
};

const changeProjectManager = async (projectId, projectManager, currentUser) => {

    const project = await Project.findOne({
        _id: projectId,
        isDeleted: false,
    });

    if (!project) {
        throw new AppError(
            "Project not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    const manager = await User.findById(projectManager).select(
        "firstName lastName"
    );

    if (!manager) {
        throw new AppError(
            "Project manager not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    // Fetch previous manager (for activity log)
    let oldManager = null;

    if (project.projectManager) {
        oldManager = await User.findById(project.projectManager).select(
            "firstName lastName"
        );
    }

    // Prevent unnecessary update
    if (
        project.projectManager &&
        project.projectManager.toString() === projectManager.toString()
    ) {
        throw new AppError(
            "Selected user is already the project manager.",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    // Update manager
    project.projectManager = projectManager;

    // Ensure manager is part of the team
    const isAlreadyTeamMember = project.teamMembers.some(
        (member) => member.toString() === projectManager.toString()
    );

    if (!isAlreadyTeamMember) {
        project.teamMembers.push(projectManager);
    }

    project.updatedBy = currentUser._id;

    await project.save();

    // Activity Log
    await createActivityLog({
        module: "Project",
        action: "Change Manager",
        description: `${currentUser.fullName} changed project manager for ${project.name}`,
        recordId: project._id,
        performedBy: currentUser._id,
        metadata: {
            previousValue: oldManager
                ? {
                    managerId: oldManager._id,
                    managerName: `${oldManager.firstName} ${oldManager.lastName}`,
                }
                : null,

            newValue: {
                managerId: manager._id,
                managerName: `${manager.firstName} ${manager.lastName}`,
            },
        },
    });

    return project;
};


module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    assignTeamMembers,
    removeTeamMember,
    changeProjectManager
};
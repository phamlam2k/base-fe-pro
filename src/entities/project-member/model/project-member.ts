/** Project-member entity — an internal company member assigned to a project. */
export interface ProjectMember {
  id: string;
  projectId: string;
  companyMemberId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

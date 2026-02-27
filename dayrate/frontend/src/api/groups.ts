import { apiFetch } from './client'

export interface Group {
  id: string
  name: string
  inviteCode: string
  ownerId: string
  memberCount?: number
  joinedAt?: string
}

export interface GroupMember {
  userId: string
  name: string
  joinedAt: string
  todayRating: number | null
  overallAvg: number | null
}

export interface GroupDetail extends Group {
  todayGroupAvg: number | null
  overallGroupAvg: number | null
  members: GroupMember[]
}

export function createGroup(name: string) {
  return apiFetch<Group>('/api/groups', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function joinGroup(inviteCode: string) {
  return apiFetch<{ message: string; groupId: string; groupName: string }>('/api/groups/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  })
}

export function listGroups() {
  return apiFetch<Group[]>('/api/groups')
}

export function getGroupDetail(id: string) {
  return apiFetch<GroupDetail>(`/api/groups/${id}`)
}

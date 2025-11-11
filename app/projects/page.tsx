import { redirect } from 'next/navigation'

export default function ProjectsPage() {
  redirect('/generate?view=projects')
}


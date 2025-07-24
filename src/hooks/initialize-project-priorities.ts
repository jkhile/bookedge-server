import { HookContext } from '../declarations'

// Default HTML template for project priorities
export const PROJECT_PRIORITIES_TEMPLATE = `<p><strong>Next meeting time:</strong> </p><p><strong>Agenda for next meeting:</strong> </p><p></p><ul><li><p><strong>Front matter / End matter:</strong> </p></li><li><p><strong>Endorsements:</strong> </p></li><li><p><strong>Dedications:</strong> </p></li><li><p><strong>Foreword or Preface?</strong> </p></li><li><p><strong>Afterword?</strong> </p></li><li><p><strong>Acknowledgments:</strong> </p></li><li><p><strong>Call to Action page:</strong> </p></li><li><p><strong>Appendix or Afterword?</strong> </p><p></p></li></ul><p><strong>Endorsements:</strong> </p><p></p><p><strong>Author resources:</strong> </p><p></p><p><strong>Photos:</strong> </p><p></p>`

export const initializeProjectPriorities = async (context: HookContext) => {
  // Only run on create operations
  if (context.method !== 'create') {
    return context
  }

  // Only run on data that doesn't already have project_priorities set
  if (context.data && !context.data.project_priorities) {
    context.data.project_priorities = PROJECT_PRIORITIES_TEMPLATE
  }

  return context
}

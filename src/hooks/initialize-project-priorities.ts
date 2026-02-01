import { HookContext } from '../declarations'

// Default HTML template for project priorities
export const PROJECT_PRIORITIES_TEMPLATE = `<p><strong>AUTHOR PHOTOS</strong></p><p>What do we have now? Should a pro-photographer be hired?</p><p></p><p><strong>MEDIA ELEMENTS</strong></p><p>Are there photos, videos or audio clips to optimize and place.</p><p></p><p><strong>COVER</strong></p><p>What should we tell Rick Nease?</p><p></p><p><strong>TITLE AND SUBTITLE</strong></p><p>Researching title and subtitle.</p><p></p><p><strong>ANGELS &amp; ALLIES</strong></p><p>Explain these 2 concepts.</p><p>Work out a shared list</p><p></p><p><strong>ENDORSEMENTS</strong></p><p>Work out a shared list to contact</p><p></p><p><strong>MEDIA LIST</strong></p><p>Work out a shared list to contact</p><p></p><p><strong>FRONTMATTER</strong></p><ul><li><p>Copyright page issues?</p></li><li><p>Rights and permissions issues?</p></li><li><p>Table of Contents</p></li><li><p>Foreword, Preface, Introduction?</p></li><li><p>Dedication page</p></li></ul><p></p><p><strong>ENDMATTER</strong></p><ul><li><p>Afterword / Epilogue</p></li><li><p>Resource section</p></li><li><p>Acknowledgments</p></li><li><p>Any need for an "emergency contacts" page?</p></li><li><p>About the Author</p></li><li><p>Call to Action</p></li><li><p>Advertisements</p></li></ul><p></p><p><strong>METADATA</strong></p><ul><li><p>Summaries (various lengths)</p></li><li><p>Author bios (various lengths)</p></li><li><p>Keywords</p></li><li><p>BISAC codes</p></li><li><p>Thema codes</p></li></ul><p></p><p><strong>MARKETING</strong></p><p>Press release materials</p><p></p><p><strong>DISCUSSION GUIDE(s)</strong></p><p>Discuss whether we want questions in the book or a downloadable PDF</p>`

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

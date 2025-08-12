interface Poll {
  id: string
  question: string
  options: Array<{
    id: string
    label: string
    count: number
  }>
}

export function buildDiscordButtons(poll: Poll, baseUrl: string) {
  // Build vote buttons (max 5 per row)
  const voteButtons = poll.options.map(option => ({
    type: 2, // BUTTON
    style: 1, // PRIMARY
    label: option.label,
    custom_id: JSON.stringify({ pollId: poll.id, optionId: option.id })
  }))
  
  // Add results link button
  const linkButton = {
    type: 2, // BUTTON  
    style: 5, // LINK
    label: 'View Results',
    url: `${baseUrl}/polls/${poll.id}`
  }
  
  // Discord allows max 5 buttons per row
  const components = []
  
  // Add vote buttons in rows of 5
  for (let i = 0; i < voteButtons.length; i += 5) {
    components.push({
      type: 1, // ACTION_ROW
      components: voteButtons.slice(i, i + 5)
    })
  }
  
  // Add link button in separate row
  components.push({
    type: 1, // ACTION_ROW
    components: [linkButton]
  })
  
  return components
}

export function buildTallyContent(poll: Poll): string {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.count, 0)
  
  let content = `**${poll.question}**\\n\\n`
  
  poll.options.forEach(option => {
    const percentage = totalVotes > 0 ? ((option.count / totalVotes) * 100).toFixed(1) : '0.0'
    content += `• **${option.label}**: ${option.count} vote${option.count !== 1 ? 's' : ''} (${percentage}%)\\n`
  })
  
  content += `\\n*Total votes: ${totalVotes}*`
  
  return content
}
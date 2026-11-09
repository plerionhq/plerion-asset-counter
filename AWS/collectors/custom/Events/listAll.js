// EventBridge list calls have no paginators, so follow NextToken by hand.
export const listAll = async (client, Command, input, key) => {
  const items = [];
  let NextToken;
  do {
    const page = await client.send(new Command({ ...input, NextToken }));
    items.push(...(page[key] || []));
    NextToken = page.NextToken;
  } while (NextToken);
  return items;
};

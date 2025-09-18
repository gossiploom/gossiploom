-- Add some Politics category posts to showcase the new category
INSERT INTO public.gossip_posts (title, content, excerpt, category, author_name, image_url, is_trending, likes_count, comments_count, created_at) VALUES
(
  'Political Insider Reveals Secret Party Drama',
  'An anonymous source from Capitol Hill has revealed shocking behind-the-scenes drama that has been brewing for months. The tensions between party leaders have reached a boiling point, with heated arguments happening during what were supposed to be peaceful strategy meetings.

According to our source, the disagreements stem from fundamental differences in approach to upcoming legislation. "You would not believe the things being said in those closed-door meetings," our insider revealed. "It is like watching a soap opera unfold."

The drama has apparently been building since the last major vote, where several members broke ranks unexpectedly. This has led to a complete breakdown in trust among the leadership team.

Sources close to the situation say that the conflict has gotten so intense that some members are considering dramatic moves that could reshape the entire political landscape.',
  'Capitol Hill insider spills tea on explosive party drama that has been brewing behind closed doors...',
  'Politics',
  'Political Insider',
  NULL,
  false,
  234,
  67,
  NOW() - INTERVAL '3 hours'
),
(
  'Campaign Manager Shocking Confession About Election Strategy',
  'A former campaign manager has come forward with explosive revelations about the dirty tactics used during the last election cycle. In an exclusive interview, they revealed the shocking lengths their team went to in order to secure victory.

"We did things that would make your head spin," the anonymous source confessed. "The public has no idea what really goes on behind the scenes of a major political campaign."

The revelations include details about opposition research, social media manipulation, and questionable fundraising practices. The source claims that these tactics are standard across the industry, regardless of party affiliation.

Most shocking of all are the claims about how voter data was collected and used. "We knew more about individual voters than they probably knew about themselves," the source revealed.

The confession has sent shockwaves through political circles, with many calling for investigations into campaign practices.',
  'Former campaign manager spills shocking secrets about election tactics that will blow your mind...',
  'Politics',
  'Campaign Whistleblower',
  NULL,
  true,
  456,
  123,
  NOW() - INTERVAL '1 day'
),
(
  'Governor Family Feud Explodes Into Public View',
  'What started as private family drama has now become a very public spectacle involving a sitting governor and their estranged sibling. Sources close to the family reveal that the feud has been brewing for years, but recent events have pushed things over the edge.

The conflict apparently centers around business deals that went wrong and allegations of using political influence for personal gain. "It has gotten ugly," says a family friend who wished to remain anonymous.

The situation became public when the governor sibling posted a series of cryptic social media messages that many interpreted as veiled threats. This led to a very public back-and-forth that has political observers scratching their heads.

The drama has escalated to the point where other family members are being forced to choose sides. Legal experts suggest that this could potentially impact the governor political future if more details emerge.',
  'Governor family drama spills into public in the messiest political scandal of the year...',
  'Politics',
  'Political Reporter',
  NULL,
  false,
  189,
  45,
  NOW() - INTERVAL '6 hours'
);
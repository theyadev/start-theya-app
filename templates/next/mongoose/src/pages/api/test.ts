// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from 'next';
import { connectToMongo } from '@/lib/mongodb';

import Example from '@/models/Example';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToMongo()
  
  const examples = await Example.find({});

  res.status(200).json(examples);
}

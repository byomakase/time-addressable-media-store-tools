FROM public.ecr.aws/lambda/nodejs:22-arm64

COPY app.mjs package*.json ./
RUN npm ci --production

# Command can be overwritten by providing a different command in the template directly.
CMD ["app.lambdaHandler"]

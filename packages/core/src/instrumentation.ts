import { type Logger } from '@opentelemetry/api-logs';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { KoaInstrumentation } from '@opentelemetry/instrumentation-koa';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { Resource } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const { OTEL_COLLECTOR_URL } = process.env;
const { OTEL_SERVICE_NAME } = process.env;

/* eslint-disable no-console, @silverhand/fp/no-let, @silverhand/fp/no-mutation */
let loggerOtel: Logger | undefined;
let sdk: NodeSDK;

if (OTEL_COLLECTOR_URL) {
  try {
    sdk = new NodeSDK({
      serviceName: OTEL_SERVICE_NAME,

      traceExporter: new OTLPTraceExporter({
        url: `${OTEL_COLLECTOR_URL}`,
        compression: CompressionAlgorithm.GZIP,
      }),

      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${OTEL_COLLECTOR_URL}`,
          compression: CompressionAlgorithm.GZIP,
        }),
      }),

      logRecordProcessors: [
        new BatchLogRecordProcessor(
          new OTLPLogExporter({
            url: `${OTEL_COLLECTOR_URL}`,
            compression: CompressionAlgorithm.GZIP,
          })
        ),
      ],
      textMapPropagator: new W3CTraceContextPropagator(),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
        new KoaInstrumentation(),
      ],
    });

    sdk.start();

    console.log('OpenTelemetry instrumentation started successfully.');
  } catch (error) {
    console.error('Error starting OpenTelemetry instrumentation:', error);
  }
} else {
  console.warn('OTEL_COLLECTOR_URL not set. Skipping OpenTelemetry instrumentation.');
}
/* eslint-enable no-console, @silverhand/fp/no-let, @silverhand/fp/no-mutation */

export function getLogger(): Logger {
  /* eslint-disable @silverhand/fp/no-mutation */
  if (!OTEL_COLLECTOR_URL) {
    throw new Error('OTEL_COLLECTOR_URL not set. Logger not available!');
  }

  if (loggerOtel) {
    return loggerOtel;
  }

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
  });

  const loggerProvider = new LoggerProvider({
    resource,
  });

  loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: OTEL_COLLECTOR_URL,
        compression: CompressionAlgorithm.GZIP,
      })
    )
  );

  loggerOtel = loggerProvider.getLogger(OTEL_SERVICE_NAME + '_logger');
  return loggerOtel;
  /* eslint-enable @silverhand/fp/no-mutation */
}

process.on('SIGTERM', () => {
  /* eslint-disable no-console, promise/prefer-await-to-then */
  sdk
    .shutdown()
    .then(
      () => {
        console.log('SDK shut down successfully');
      },
      (error) => {
        console.log('Error shutting down SDK', error);
      }
    )
    .finally(() => process.exit(0));
  /* eslint-enable no-console, promise/prefer-await-to-then */
});

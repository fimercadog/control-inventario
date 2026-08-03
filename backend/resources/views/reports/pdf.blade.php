<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>{{ $resultado->titulo }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #1f2937; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .meta { color: #6b7280; margin-bottom: 16px; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d1d5db; padding: 4px 6px; text-align: left; }
        th { background-color: #f3f4f6; }
        tfoot td { font-weight: bold; background-color: #f9fafb; }
    </style>
</head>
<body>
    <h1>{{ $resultado->titulo }}</h1>
    <div class="meta">
        Generado el {{ now()->format('Y-m-d H:i') }} — {{ $resultado->total }} registro(s)
    </div>

    <table>
        <thead>
            <tr>
                @foreach ($resultado->columnas as $columna)
                    <th>{{ $columna['etiqueta'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($resultado->filas as $fila)
                <tr>
                    @foreach ($resultado->columnas as $columna)
                        <td>{{ $fila[$columna['clave']] ?? '' }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($resultado->columnas) }}">Sin datos para los filtros seleccionados.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>

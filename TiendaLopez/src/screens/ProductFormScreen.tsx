import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import Barcode from 'react-native-barcode-svg';
import RNPrint from 'react-native-print';
import { barcodeFormatFor, buildBarcodeLabelHtml } from '@utils/barcodeLabel';
import {
  createBrand,
  createCategory,
  createProduct,
  createTematica,
  deleteProduct,
  getBrands,
  getCategories,
  getNextProductCode,
  getTematicas,
  updateProduct,
} from '@services/catalog';
import { API_BASE_URL } from '@constants/api';
import { Brand, Category, Product, Tematica } from '@models/index';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';
import { Dropdown } from '@components/forms/Dropdown';
import { useConfirm } from '@context/ConfirmDialogContext';

const COTILLON_CATEGORY_NAME = 'Cotillón';
const IMAGE_PICKER_OPTIONS = {
  mediaType: 'photo' as const,
  quality: 0.7 as const,
  maxWidth: 1200,
  maxHeight: 1200,
  includeBase64: true as const,
};

type ImageEntry =
  | { kind: 'existing'; id: number; previewUri: string }
  | { kind: 'new'; base64: string; mimeType: string; previewUri: string };

// El teclado numérico de Android a veces muestra "," además de ".". Los precios
// solo aceptan punto, así que cualquier coma tocada se convierte en punto.
const sanitizeDecimalInput = (value: string) => {
  const withDot = value.replace(/,/g, '.');
  const digitsAndDot = withDot.replace(/[^0-9.]/g, '');
  const [wholePart, ...rest] = digitsAndDot.split('.');
  return rest.length > 0 ? `${wholePart}.${rest.join('')}` : wholePart;
};

export const ProductFormScreen = ({ route, navigation }: any) => {
  const product: Product | null = route.params?.product ?? null;
  const isEditing = product !== null;

  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tematicas, setTematicas] = useState<Tematica[]>([]);

  const [code, setCode] = useState(product?.code ?? '');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [printingCode, setPrintingCode] = useState(false);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(product?.category_id ?? null);
  const [brandId, setBrandId] = useState<number | null>(product?.brand_id ?? null);
  const [tematicaId, setTematicaId] = useState<number | null>(product?.tematica_id ?? null);
  const [price, setPrice] = useState(product?.price ? String(product.price) : '');
  const [price2, setPrice2] = useState(product?.price2 ? String(product.price2) : '');
  const [costPrice, setCostPrice] = useState(
    product?.cost_price ? String(product.cost_price) : '',
  );
  const [stock, setStock] = useState(product ? String(product.stock) : '0');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [images, setImages] = useState<ImageEntry[]>(
    (product?.images ?? []).map(img => ({
      kind: 'existing' as const,
      id: img.id,
      previewUri: `${API_BASE_URL}${img.url}`,
    })),
  );

  useEffect(() => {
    getCategories().then(data => {
      setCategories(data);
      setCategoryId(current => current ?? (data.length > 0 ? data[0].id : null));
    });
    getBrands().then(setBrands);
    getTematicas().then(setTematicas);
  }, []);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const isCotillon = selectedCategory?.name === COTILLON_CATEGORY_NAME;

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const nextCode = await getNextProductCode();
      setCode(nextCode);
    } catch {
      setError('No se pudo generar el código');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handlePrintCode = async () => {
    setPrintingCode(true);
    try {
      await RNPrint.print({
        html: buildBarcodeLabelHtml(code.trim(), name.trim()),
        jobName: `Codigo-${code.trim()}`,
      });
    } catch {
      // El usuario canceló el diálogo de impresión u ocurrió un error del sistema.
    } finally {
      setPrintingCode(false);
    }
  };

  const handleCreateCategory = async (newName: string) => {
    const created = await createCategory(newName);
    setCategories(prev => [...prev, created]);
    setCategoryId(created.id);
  };

  const handleCreateBrand = async (newName: string) => {
    const created = await createBrand(newName);
    setBrands(prev => [...prev, created]);
    setBrandId(created.id);
  };

  const handleCreateTematica = async (newName: string) => {
    const created = await createTematica(newName);
    setTematicas(prev => [...prev, created]);
    setTematicaId(created.id);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const result =
      source === 'camera'
        ? await launchCamera(IMAGE_PICKER_OPTIONS)
        : await launchImageLibrary(IMAGE_PICKER_OPTIONS);

    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      setError(
        result.errorCode === 'camera_unavailable'
          ? 'No se pudo acceder a la cámara'
          : result.errorMessage ?? 'No se pudo abrir la foto',
      );
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset.base64) {
      return;
    }

    setError(null);
    setImages(prev => [
      ...prev,
      {
        kind: 'new',
        base64: asset.base64!,
        mimeType: asset.type ?? 'image/jpeg',
        previewUri: asset.uri!,
      },
    ]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const parsedStock = parseInt(stock, 10);
    const parsedPrice = price.trim() ? parseFloat(price) : null;
    const parsedPrice2 = price2.trim() ? parseFloat(price2) : null;

    if (!code.trim() || !name.trim() || !categoryId) {
      setError('Completá código, nombre y categoría');
      return;
    }
    if (parsedPrice === null && parsedPrice2 === null) {
      setError('Ingresá Precio 1 o Precio 2 (al menos uno de los dos)');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        category_id: categoryId,
        brand_id: brandId,
        tematica_id: isCotillon ? tematicaId : null,
        images: images.map(img =>
          img.kind === 'existing'
            ? { existingId: img.id }
            : { data: img.base64, mime_type: img.mimeType },
        ),
        price: parsedPrice,
        price2: parsedPrice2,
        cost_price: costPrice.trim() ? parseFloat(costPrice) : null,
        stock: Number.isNaN(parsedStock) ? 0 : parsedStock,
      };
      if (isEditing) {
        await updateProduct(product!.id, payload);
      } else {
        await createProduct(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'No se pudo guardar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Eliminar producto',
      message: `¿Seguro que querés eliminar "${product?.name}"?`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    await deleteProduct(product!.id);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{isEditing ? 'Editar producto' : 'Nuevo producto'}</Text>

        <View style={[styles.photosCard, Shadows.card]}>
          <View style={styles.photosHeader}>
            <View style={styles.photosIcon}>
              <Icon name="images" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.photosTitle}>Fotos</Text>
            {images.length > 0 && (
              <Text style={styles.photosCount}>{images.length}</Text>
            )}
          </View>

          <View style={styles.imageGrid}>
            {images.map((img, index) => (
              <View key={index} style={[styles.imageThumb, Shadows.card]}>
                <Image
                  source={{ uri: img.previewUri }}
                  style={styles.imageThumbImg}
                  resizeMode="cover"
                />
                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Principal</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  hitSlop={8}
                >
                  <Icon name="close" size={13} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addImageTile}
              onPress={() => pickImage('camera')}
              activeOpacity={0.7}
            >
              <Icon name="camera-outline" size={22} color={Colors.primary} />
              <Text style={styles.addImageTileText}>Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addImageTile}
              onPress={() => pickImage('library')}
              activeOpacity={0.7}
            >
              <Icon name="images-outline" size={22} color={Colors.primary} />
              <Text style={styles.addImageTileText}>Galería</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Código</Text>
        <View style={styles.codeRow}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="Ej: PROD-001"
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
          />
          <TouchableOpacity
            style={[styles.generateCodeButton, generatingCode && styles.buttonDisabled]}
            onPress={handleGenerateCode}
            disabled={generatingCode}
          >
            <Icon name="sync-outline" size={16} color={Colors.white} />
            <Text style={styles.generateCodeButtonText}>
              {generatingCode ? '...' : 'Generar'}
            </Text>
          </TouchableOpacity>
        </View>

        {code.trim().length > 0 && (
          <View style={styles.barcodeCard}>
            <Barcode
              value={code.trim()}
              format={barcodeFormatFor(code.trim())}
              height={70}
              maxWidth={280}
              singleBarWidth={2}
              lineColor={Colors.text}
              backgroundColor={Colors.white}
            />
            <Text style={styles.barcodeText}>{code.trim()}</Text>
            <TouchableOpacity
              style={[styles.printCodeButton, printingCode && styles.buttonDisabled]}
              onPress={handlePrintCode}
              disabled={printingCode}
            >
              <Icon name="print-outline" size={16} color={Colors.white} />
              <Text style={styles.printCodeButtonText}>
                {printingCode ? 'Abriendo...' : 'Imprimir código'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.dropdownWrapper}>
          <Dropdown
            label="Categoría"
            icon="pricetag-outline"
            items={categories}
            selectedId={categoryId}
            onSelect={id => setCategoryId(id)}
            onCreate={handleCreateCategory}
            allowNull={false}
          />
        </View>

        <View style={styles.dropdownWrapper}>
          <Dropdown
            label="Marca"
            icon="ribbon-outline"
            items={brands}
            selectedId={brandId}
            onSelect={setBrandId}
            onCreate={handleCreateBrand}
            allLabel="Sin marca"
          />
        </View>

        {isCotillon && (
          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Temática"
              icon="color-palette-outline"
              items={tematicas}
              selectedId={tematicaId}
              onSelect={setTematicaId}
              onCreate={handleCreateTematica}
              allLabel="Sin temática"
            />
          </View>
        )}

        <Text style={styles.label}>Precio 1 (Bs.) · mayorista (opcional, con tal de cargar uno)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={text => setPrice(sanitizeDecimalInput(text))}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Precio 2 (Bs.) · por unidad (opcional, con tal de cargar uno)</Text>
        <TextInput
          style={styles.input}
          value={price2}
          onChangeText={text => setPrice2(sanitizeDecimalInput(text))}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Precio de compra (Bs.) · costo, solo vos lo ves</Text>
        <TextInput
          style={styles.input}
          value={costPrice}
          onChangeText={text => setCostPrice(sanitizeDecimalInput(text))}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Stock</Text>
        <TextInput
          style={styles.input}
          value={stock}
          onChangeText={setStock}
          keyboardType="number-pad"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.saveButton, submitting && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={submitting}
        >
          <Text style={styles.saveButtonText}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Eliminar producto</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: SPACING.lg,
  },
  photosCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  photosIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: '#EAF0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 16,
    flex: 1,
  },
  photosCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  imageThumb: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageThumbImg: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 43, 73, 0.75)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  mainBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(26, 43, 73, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageTile: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: '#EAF0FA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageTileText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  dropdownWrapper: {
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  codeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'stretch',
  },
  codeInput: {
    flex: 1,
  },
  generateCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  generateCodeButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  barcodeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  barcodeText: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  printCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  printCodeButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  error: {
    color: Colors.danger,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  cancelButtonText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
});
